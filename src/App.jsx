import React, { useMemo, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import PlayerInput from './components/PlayerInput';
import TeamDisplay from './components/TeamDisplay';
import useTeamGenerator from './hooks/useTeamGenerator';
import './App.css';
import { FiCopy, FiArrowLeft } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';

const STEPS = {
  WELCOME: 'welcome',
  SETTINGS: 'settings',
  PLAYERS: 'players',
  RESULTS: 'results',
};

const STEP_ORDER = [STEPS.SETTINGS, STEPS.PLAYERS, STEPS.RESULTS];

const STEP_META = {
  [STEPS.SETTINGS]: {
    label: 'Configurar',
    title: 'Configuración de equipos',
    description: 'Definí la cantidad de equipos y jugadores por equipo.'
  },
  [STEPS.PLAYERS]: {
    label: 'Cargar jugadores',
    title: 'Cargar jugadores',
    description: 'Agregá jugadores uno por uno o pegá una lista completa.'
  },
  [STEPS.RESULTS]: {
    label: 'Generar',
    title: 'Equipos generados',
    description: 'Compartí los equipos o reiniciá la configuración.'
  }
};

const SAMPLE_PLAYERS = [
  'Alex Torres',
  'Belén Ruiz',
  'Carlos Díaz',
  'Daniela Soto',
  'Elena Márquez',
  'Federico Ríos',
  'Gabriela Molina',
  'Hernán Vega',
  'Ivana López',
  'Julián Paredes',
  'Karina Santos',
  'Lucas Navarro',
  'Marina Castro',
  'Nicolás Álvarez',
  'Olivia Ramos',
  'Pablo Herrera',
  'Renata Flores',
  'Santiago Núñez',
  'Tamara Iglesias',
  'Valentín Luna'
];

const formatName = (name) => {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .trim();
};

const App = () => {
  const {
    players,
    teams,
    addPlayer,
    removePlayer,
    generateTeams,
    numTeams,
    setNumTeams,
    teamSize,
    setTeamSize,
    getPlayersRemaining,
    getTotalPlayersNeeded,
    clearTeams,
    setPlayers
  } = useTeamGenerator();

  const [currentStep, setCurrentStep] = useState(STEPS.WELCOME);
  const [isLoading, setIsLoading] = useState(false);
  const [bulkInput, setBulkInput] = useState('');

  const activeStepIndex = STEP_ORDER.indexOf(currentStep);

  const totalPlayersNeeded = useMemo(
    () => getTotalPlayersNeeded(numTeams, teamSize),
    [getTotalPlayersNeeded, numTeams, teamSize]
  );

  const playersRemaining = useMemo(
    () => getPlayersRemaining(numTeams, teamSize),
    [getPlayersRemaining, numTeams, teamSize]
  );

  const handleAddPlayer = (name) => {
    const formattedName = formatName(name);
    if (!formattedName) {
      toast.error('Por favor ingresá un nombre válido');
      return;
    }

    const remaining = totalPlayersNeeded - players.length;

    if (remaining <= 0) {
      toast.warning('Ya se alcanzó el límite de jugadores');
      return;
    }

    if (players.includes(formattedName)) {
      toast.warning('Este jugador ya está en la lista');
      return;
    }

    if (addPlayer(formattedName)) {
      const newRemaining = totalPlayersNeeded - (players.length + 1);
      if (newRemaining === Math.floor(totalPlayersNeeded / 2)) {
        toast.info(`Vas por la mitad. Faltan ${newRemaining} jugadores.`);
      } else if (newRemaining === 1) {
        toast.info('Falta 1 jugador para completar la lista.');
      } else if (newRemaining === 0) {
        toast.success('Lista completa. Ya podés generar los equipos.');
      }
    }
  };

  const handleBulkInput = () => {
    const names = bulkInput
      .split('\n')
      .map(name => formatName(name))
      .filter(name => name.length > 0);

    if (names.length === 0) {
      toast.error('No se encontraron nombres válidos');
      return;
    }

    const remainingSlots = totalPlayersNeeded - players.length;

    if (remainingSlots <= 0) {
      toast.warning('Ya se alcanzó el límite de jugadores');
      return;
    }

    let added = 0;
    const initialCount = players.length;

    for (const name of names) {
      if (added >= remainingSlots) break;
      if (!players.includes(name) && addPlayer(name)) {
        added++;
      }
    }

    if (added > 0) {
      const newTotal = initialCount + added;
      const remaining = totalPlayersNeeded - newTotal;

      if (remaining === 0) {
        toast.success('Lista completa. Ya podés generar los equipos.');
      } else if (remaining <= Math.floor(totalPlayersNeeded / 2)) {
        toast.info(`Buen progreso. Solo faltan ${remaining} jugadores.`);
      } else {
        toast.success(`Se agregaron ${added} jugadores.`);
      }

      setBulkInput('');
    }
  };

  const handleLoadSamplePlayers = () => {
    const formattedSamples = SAMPLE_PLAYERS.map(formatName);
    const uniqueSamples = Array.from(new Set(formattedSamples));
    const nextPlayers = uniqueSamples.slice(0, totalPlayersNeeded);
    setPlayers(nextPlayers);
    clearTeams();
    toast.info('Ejemplo cargado. Ya podés generar equipos.');
  };

  const handleClearPlayers = () => {
    setPlayers([]);
    clearTeams();
    toast.info('Lista de jugadores limpia.');
  };

  const handleGenerateTeams = async () => {
    if (players.length < totalPlayersNeeded) {
      toast.error(`Necesitás ${totalPlayersNeeded - players.length} jugadores más`);
      return;
    }

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1600));
    generateTeams();
    setIsLoading(false);
    setCurrentStep(STEPS.RESULTS);
    toast.success('Equipos generados.');
  };

  const handleShare = async () => {
    const teamsText = formatTeamsText();
    if (!teamsText) return;

    try {
      await navigator.clipboard.writeText(teamsText);
      toast.success('Equipos copiados al portapapeles.');

      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Equipos generados por Aleato',
            text: teamsText
          });
        } catch (err) {
          console.log('Share cancelled or failed');
        }
      }
    } catch (err) {
      toast.error('Error al copiar los equipos');
      console.error('Error al copiar:', err);
    }
  };

  const formatTeamsText = () => {
    if (!teams.length) return '';

    return teams
      .map(team => `${team.name}:\n${team.players.join('\n')}`)
      .join('\n\n');
  };

  const handleShareWhatsApp = () => {
    const teamsText = formatTeamsText();
    if (!teamsText) return;

    const encodedText = encodeURIComponent(teamsText);
    const whatsappUrl = `https://wa.me/?text=${encodedText}`;

    window.open(whatsappUrl, '_blank');
  };

  const handleRemovePlayer = (name) => {
    removePlayer(name);
    toast.info('Jugador eliminado');
  };

  const handleReset = () => {
    clearTeams();
    setPlayers([]);
    setNumTeams(2);
    setTeamSize(2);
    setCurrentStep(STEPS.SETTINGS);
    toast.info('Configuración reiniciada');
  };

  const renderStepHeader = () => {
    if (currentStep === STEPS.WELCOME) return null;
    const stepMeta = STEP_META[currentStep];

    return (
      <div className="step-header">
        <p className="step-eyebrow">Paso {activeStepIndex + 1} de 3</p>
        <h2>{stepMeta.title}</h2>
        <p className="step-description">{stepMeta.description}</p>
      </div>
    );
  };

  const renderStep = () => {
    switch (currentStep) {
      case STEPS.WELCOME:
        return (
          <section className="welcome-screen">
            <div className="hero">
              <span className="hero-badge">Aleato Teams</span>
              <h1>Equipos balanceados en segundos</h1>
              <p>
                Una experiencia simple y profesional para organizar partidos, juegos o
                actividades grupales.
              </p>
              <div className="hero-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => setCurrentStep(STEPS.SETTINGS)}
                >
                  Comenzar
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => setCurrentStep(STEPS.SETTINGS)}
                >
                  Ver flujo de trabajo
                </button>
              </div>
              <div className="hero-stats">
                <div>
                  <span className="stat-title">Configurar</span>
                  <span className="stat-value">Número de equipos</span>
                </div>
                <div>
                  <span className="stat-title">Cargar</span>
                  <span className="stat-value">Jugadores en bloque</span>
                </div>
                <div>
                  <span className="stat-title">Generar</span>
                  <span className="stat-value">Equipos equilibrados</span>
                </div>
              </div>
            </div>
          </section>
        );

      case STEPS.SETTINGS:
        return (
          <section className="settings-screen">
            {renderStepHeader()}
            <div className="settings-grid">
              <div className="panel">
                <div className="panel-header">
                  <h3>Definí la estructura</h3>
                  <p>Podés ajustar estos valores en cualquier momento.</p>
                </div>
                <div className="settings-form">
                  <label className="field">
                    <span>Número de equipos</span>
                    <input
                      type="number"
                      value={numTeams}
                      onChange={(e) => setNumTeams(e.target.value)}
                      min="2"
                      max="10"
                      required
                    />
                  </label>
                  <label className="field">
                    <span>Jugadores por equipo</span>
                    <input
                      type="number"
                      value={teamSize}
                      onChange={(e) => setTeamSize(e.target.value)}
                      min="2"
                      max="11"
                      required
                    />
                  </label>
                </div>
              </div>
              <div className="panel panel-accent">
                <h4>Resumen</h4>
                <p className="summary-value">{totalPlayersNeeded}</p>
                <p className="summary-label">Jugadores necesarios</p>
                <div className="summary-hint">
                  Distribución automática y equitativa al generar.
                </div>
              </div>
            </div>
            <div className="navigation-buttons">
              <button className="btn btn-ghost" onClick={() => setCurrentStep(STEPS.WELCOME)}>
                Volver
              </button>
              <button
                className="btn btn-primary"
                onClick={() => setCurrentStep(STEPS.PLAYERS)}
                disabled={numTeams < 2 || teamSize < 2}
              >
                Continuar
              </button>
            </div>
          </section>
        );

      case STEPS.PLAYERS:
        return (
          <section className="players-screen">
            {renderStepHeader()}
            <div className="progress-card">
              <div>
                <p className="progress-title">
                  {playersRemaining > 0
                    ? `Faltan ${playersRemaining} jugadores`
                    : 'Listo para generar equipos'}
                </p>
                <p className="progress-subtitle">
                  {players.length} de {totalPlayersNeeded} cargados
                </p>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${(players.length / totalPlayersNeeded) * 100}%`
                  }}
                />
              </div>
            </div>

            <div className="quick-actions">
              <button
                className="btn btn-ghost"
                onClick={handleLoadSamplePlayers}
                disabled={totalPlayersNeeded <= 0}
              >
                Cargar ejemplo
              </button>
              <button
                className="btn btn-outline"
                onClick={handleClearPlayers}
                disabled={players.length === 0}
              >
                Limpiar lista
              </button>
            </div>

            <div className="input-sections">
              <PlayerInput
                onAddPlayer={handleAddPlayer}
                disabled={playersRemaining <= 0}
              />

              <div className="panel">
                <div className="panel-header">
                  <h3>Carga rápida</h3>
                  <p>Pegá una lista con un jugador por línea.</p>
                </div>
                <textarea
                  value={bulkInput}
                  onChange={(e) => setBulkInput(e.target.value)}
                  placeholder="Ejemplo:\nJuan Pérez\nMaría García\nCarlos López"
                  rows="6"
                  aria-label="Lista de jugadores"
                  disabled={playersRemaining <= 0}
                />
                <button
                  className="btn btn-primary"
                  onClick={handleBulkInput}
                  disabled={playersRemaining <= 0}
                >
                  Agregar lista
                </button>
              </div>
            </div>

            {players.length > 0 && (
              <div className="players-list">
                <div className="players-list-header">
                  <h3>Jugadores cargados</h3>
                  <span>{players.length}</span>
                </div>
                <div className="players-grid">
                  {players.map(player => (
                    <div key={player} className="player-item">
                      <span className="player-name">{player}</span>
                      <button
                        className="remove-player"
                        onClick={() => handleRemovePlayer(player)}
                        title="Eliminar jugador"
                        aria-label={`Eliminar ${player}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="navigation-buttons">
              <button className="btn btn-ghost" onClick={() => setCurrentStep(STEPS.SETTINGS)}>
                Volver
              </button>
              <button
                className="btn btn-primary"
                onClick={handleGenerateTeams}
                disabled={playersRemaining > 0}
              >
                Generar equipos
              </button>
            </div>
          </section>
        );

      case STEPS.RESULTS:
        return (
          <section className="results-section">
            {renderStepHeader()}
            <TeamDisplay teams={teams} />

            <div className="actions">
              <button className="btn btn-primary" onClick={handleShare}>
                <FiCopy />
                Copiar equipos
              </button>
              <button
                onClick={handleShareWhatsApp}
                className="btn btn-whatsapp"
              >
                <FaWhatsapp />
                Compartir por WhatsApp
              </button>
              <button className="btn btn-ghost" onClick={handleReset}>
                <FiArrowLeft />
                Volver al inicio
              </button>
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand" onClick={() => setCurrentStep(STEPS.WELCOME)}>
          <span className="brand-dot" />
          <div>
            <p className="brand-title">Aleato</p>
            <p className="brand-subtitle">Generador profesional de equipos</p>
          </div>
        </div>
        {currentStep !== STEPS.WELCOME && (
          <nav className="stepper">
            {STEP_ORDER.map((stepKey, index) => {
              const step = STEP_META[stepKey];
              const isActive = index === activeStepIndex;
              const isComplete = index < activeStepIndex;
              return (
                <div
                  key={stepKey}
                  className={`stepper-item ${isActive ? 'is-active' : ''} ${isComplete ? 'is-complete' : ''}`}
                >
                  <span className="step-index">{index + 1}</span>
                  <span className="step-label">{step.label}</span>
                </div>
              );
            })}
          </nav>
        )}
      </header>

      <main className="main-content">{renderStep()}</main>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-container">
            <div className="loading-teams">
              <div className="team-circle team-1"></div>
              <div className="team-circle team-2"></div>
              <div className="team-circle team-3"></div>
            </div>
            <p>Generando equipos...</p>
          </div>
        </div>
      )}

      <footer className="footer">
        <div className="footer-content">
          <p>© 2024 Aleato. Equipos aleatorios para actividades grupales.</p>
          <div className="footer-links">
            <a href="https://github.com/nachopaezz/aleato" target="_blank" rel="noopener noreferrer">GitHub</a>
            <span className="separator">•</span>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                toast.info('Gracias por usar Aleato.');
              }}
            >
              Acerca de Aleato
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
