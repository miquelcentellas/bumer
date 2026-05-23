import React, { useState, useEffect } from 'react';
import { ProceduralScreen, UIComponent } from '@bumer/shared-types';

export default function App() {
  const [appState, setAppState] = useState<'MAIN_MENU' | 'PLAYING'>('MAIN_MENU');
  const [level, setLevel] = useState<number>(1);
  const [screen, setScreen] = useState<ProceduralScreen | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [objectiveLoading, setObjectiveLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [showObjective, setShowObjective] = useState<boolean>(false);
  const [pendingScreen, setPendingScreen] = useState<ProceduralScreen | null>(null);
  const [nextLevel] = useState<number>(1);
  const [currentTime, setCurrentTime] = useState<string>('12:45');

  // Interactivity states for Level 1 expanded objectives
  const [activePostMenuId, setActivePostMenuId] = useState<string | null>(null);
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState<string>('');
  const [userComments, setUserComments] = useState<Record<string, string[]>>({});



  // Helper to load or initialize a pool synchronously from localStorage to prevent async state race conditions
  const getPoolInfo = (lv: number): { pool: number[]; lastPlayed: number } => {
    let pools: Record<number, number[]> = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    let lastPlayedMap: Record<number, number> = { 1: -1, 2: -1, 3: -1, 4: -1, 5: -1, 6: -1 };

    try {
      const savedPools = localStorage.getItem('bumer_rotation_pools');
      if (savedPools) pools = JSON.parse(savedPools);
      const savedLast = localStorage.getItem('bumer_last_played');
      if (savedLast) lastPlayedMap = JSON.parse(savedLast);
    } catch (e) {
      console.error(e);
    }

    const maxVars = lv === 1 ? 9 : lv === 2 ? 2 : (lv === 3 || lv === 4) ? 12 : 4;
    let pool = [...(pools[lv] || [])];
    let lastPlayed = lastPlayedMap[lv] ?? -1;

    if (pool.length === 0) {
      const getMeta = (idx: number) => {
        if (lv === 1) {
          return { ver: idx % 3, obj: Math.floor(idx / 3) % 3 };
        } else if (lv === 2) {
          return { ver: idx % 2, obj: 0 };
        } else if (lv === 3 || lv === 4) {
          return { ver: Math.floor(idx / 6) % 2, obj: idx % 6 };
        } else {
          return { ver: idx % 2, obj: Math.floor(idx / 2) % 2 };
        }
      };

      // Precalculated perfect circular sequences that alternate both version & objective transitions
      let baseSequence: number[] = [];
      if (lv === 1) {
        baseSequence = [0, 4, 8, 1, 5, 6, 2, 3, 7];
      } else if (lv === 2) {
        baseSequence = [0, 1];
      } else if (lv === 3 || lv === 4) {
        baseSequence = [0, 7, 2, 9, 4, 11, 1, 6, 3, 8, 5, 10];
      } else {
        baseSequence = [0, 3, 1, 2];
      }

      const validRotations: number[][] = [];
      const backupRotations: number[][] = [];

      for (let shift = 0; shift < maxVars; shift++) {
        const rotated = [...baseSequence.slice(shift), ...baseSequence.slice(0, shift)];
        if (lastPlayed !== -1) {
          const lp = getMeta(lastPlayed);
          const first = getMeta(rotated[0]);
          const verDiff = first.ver !== lp.ver;
          const objDiff = lv === 2 || first.obj !== lp.obj;

          if (verDiff && objDiff) {
            validRotations.push(rotated);
          } else if (objDiff) {
            backupRotations.push(rotated);
          }
        } else {
          validRotations.push(rotated);
        }
      }

      // Pick a random valid shift to keep rotation fresh and guarantee O(1) performance
      let selectedSequence: number[];
      if (validRotations.length > 0) {
        const randIdx = Math.floor(Math.random() * validRotations.length);
        selectedSequence = validRotations[randIdx];
      } else if (backupRotations.length > 0) {
        const randIdx = Math.floor(Math.random() * backupRotations.length);
        selectedSequence = backupRotations[randIdx];
      } else {
        selectedSequence = [...baseSequence];
      }

      pool = selectedSequence;

      // Save replenished pool immediately
      pools[lv] = pool;
      try {
        localStorage.setItem('bumer_rotation_pools', JSON.stringify(pools));
      } catch (e) {
        console.error(e);
      }
    }

    return { pool, lastPlayed };
  };

  // Peek at the next version index without shifting it from the pool (prevents discarding versions during preview switching)
  const peekVersionIndex = (lv: number): number => {
    const { pool } = getPoolInfo(lv);
    return pool[0];
  };

  // Commit the version index by shifting it from the pool and updating lastPlayedVersion
  const commitVersionIndex = (lv: number): number => {
    const { pool } = getPoolInfo(lv);
    const popped = pool.shift() as number;

    let pools: Record<number, number[]> = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    let lastPlayedMap: Record<number, number> = { 1: -1, 2: -1, 3: -1, 4: -1, 5: -1, 6: -1 };

    try {
      const savedPools = localStorage.getItem('bumer_rotation_pools');
      if (savedPools) pools = JSON.parse(savedPools);
      const savedLast = localStorage.getItem('bumer_last_played');
      if (savedLast) lastPlayedMap = JSON.parse(savedLast);
    } catch (e) {
      console.error(e);
    }

    pools[lv] = pool;
    lastPlayedMap[lv] = popped;

    try {
      localStorage.setItem('bumer_rotation_pools', JSON.stringify(pools));
      localStorage.setItem('bumer_last_played', JSON.stringify(lastPlayedMap));
    } catch (e) {
      console.error(e);
    }

    return popped;
  };

  // Update simulated smartphone clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hrs = now.getHours().toString().padStart(2, '0');
      const mins = now.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${hrs}:${mins}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch procedurally-generated screen from Fastify backend
  const fetchScreen = async (selectedLevel: number) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    setMenuOpen(false);
    setActivePostMenuId(null);
    setActiveCommentPostId(null);
    setCommentText('');
    setUserComments({});
    try {
      const vIdx = commitVersionIndex(selectedLevel);
      // Calling our Fastify server (proxied in Vite config)
      const res = await fetch(`/api/screen/generate?level=${selectedLevel}&versionIndex=${vIdx}`);
      if (!res.ok) {
        throw new Error(`Error en el servidor: ${res.statusText}`);
      }
      const data: ProceduralScreen = await res.json();
      setScreen(data);
    } catch (err: any) {
      console.error(err);
      setError('No se pudo conectar con el motor procedural del backend. Por favor, asegúrate de levantar el servidor Fastify.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch next screen but hold it until user reads the objective
  const fetchForObjective = async (selectedLevel: number) => {
    setPendingScreen(null);
    setObjectiveLoading(true);
    try {
      const vIdx = peekVersionIndex(selectedLevel);
      const res = await fetch(`/api/screen/generate?level=${selectedLevel}&versionIndex=${vIdx}`);
      if (!res.ok) throw new Error(`Error en el servidor: ${res.statusText}`);
      const data: ProceduralScreen = await res.json();
      setPendingScreen(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setObjectiveLoading(false);
    }
  };

  // Removed the useEffect that automatically calls fetchScreen on level/state change
  // since the Main Menu flow handles it explicitly via fetchForObjective and handleStartFromObjective.

  // Handler for closing the option menu
  const handleCloseMenu = () => {
    setMenuOpen(false);
  };

  // Handler for the "Cerrar sesión" success event
  const handleLogoutClick = () => {
    setMenuOpen(false);
    if (screen?.missionText.replace(/\.$/, '') === 'Cierra la sesión') {
      setSuccess(true);
    }
  };

  // Toggles the horizontal 3-dots option menu on a post card
  const handlePostMenuToggle = (postId: string) => {
    if (success) return;
    setActivePostMenuId(activePostMenuId === postId ? null : postId);
    setActiveCommentPostId(null);
  };

  // Toggles the inline comments section on a post card
  const handleCommentToggle = (postId: string) => {
    if (success) return;
    setActiveCommentPostId(activeCommentPostId === postId ? null : postId);
    setActivePostMenuId(null);
    setCommentText('');
  };

  // Handles clicks on post-dropdown options (add friend, send message, block)
  const handlePostActionClick = (action: string) => {
    setActivePostMenuId(null);
    if (action === 'add_friend' && screen?.missionText.replace(/\.$/, '') === 'Añade a un usuario como amigo') {
      setSuccess(true);
    }
  };

  // Publishes a new comment inline on a post card
  const handlePublishComment = (postId: string) => {
    if (!commentText.trim()) return;
    const text = commentText.trim();
    setUserComments(prev => ({
      ...prev,
      [postId]: [...(prev[postId] || []), text]
    }));
    setCommentText('');

    if (screen?.missionText.replace(/\.$/, '') === 'Deja un comentario en un post') {
      setSuccess(true);
    }
  };

  // Handler for component click actions
  const handleComponentClick = (comp: UIComponent) => {
    if (success) return;
    
    if (comp.props.isTarget) {
      if (comp.type === 'TOP_NAV_SOCIAL' || comp.type === 'NAV_BAR_BOTTOM') {
        // Toggle the options dropdown menu open/close
        setMenuOpen(!menuOpen);
      } else {
        setSuccess(true);
      }
    } else {
      if (menuOpen) {
        setMenuOpen(false);
      }
      console.log('Clicked distractor:', comp.label);
    }
  };

  // Button inside success overlay: open objective screen with level selector
  const handleNextInterface = () => {
    setSuccess(false);
    setPendingScreen(null);
    setShowObjective(true);
    setActivePostMenuId(null);
    setActiveCommentPostId(null);
    setCommentText('');
    setUserComments({});
    // Auto-fetch with the current nextLevel so the objective text appears immediately
    fetchForObjective(nextLevel);
  };

  // Handler called when user taps "¡Entendido, Empezar!"
  const handleStartFromObjective = () => {
    if (pendingScreen) {
      if (pendingScreen !== screen) {
        // Commit the version since the user is now starting the level!
        commitVersionIndex(pendingScreen.complexityLevel);

        setLevel(pendingScreen.complexityLevel);
        setScreen(pendingScreen);
        setMenuOpen(false);
        setActivePostMenuId(null);
        setActiveCommentPostId(null);
        setCommentText('');
        setUserComments({});
        setAppState('PLAYING');
      }
      setPendingScreen(null);
    }
    setShowObjective(false);
  };

  // Extract navigation items so they render sticky at the bottom / top
  const topNavComponents  = screen?.components.filter(c => c.type === 'TOP_NAV_SOCIAL') || [];
  const bottomNavComponents = screen?.components.filter(c => c.type === 'NAV_BAR_BOTTOM') || [];
  const contentComponents = screen?.components.filter(
    c => c.type !== 'NAV_BAR_BOTTOM' && c.type !== 'TOP_NAV_SOCIAL'
  ) || [];

  return (
    <div className="bumer-dashboard">
      
      {/* 2. Interactive Mockup Smartphone Simulator */}
      <div className="simulator-container">
        <div className="smartphone-bezel">
          <div className="dynamic-island"></div>
          
          <div className="smartphone-screen" style={screen ? {
            '--theme-primary-bg': screen.themeColors.primaryBg,
            '--theme-surface-bg': screen.themeColors.surfaceBg,
            '--theme-text-main': screen.themeColors.textMain,
            '--theme-accent': screen.themeColors.accentColor,
            '--theme-text-muted': screen.themeColors.primaryBg === '#0B0F19' 
              ? '#9CA3AF' 
              : screen.themeColors.primaryBg === '#EBE5F9' 
                ? '#8B5CF6' 
                : '#65676B',
            '--theme-icon-bg': screen.themeColors.primaryBg === '#0B0F19' 
              ? '#374151' 
              : screen.themeColors.primaryBg === '#EBE5F9' 
                ? '#F3E8FF' 
                : '#E4E6EB',
            '--theme-icon-bg-hover': screen.themeColors.primaryBg === '#0B0F19' 
              ? '#4B5563' 
              : screen.themeColors.primaryBg === '#EBE5F9' 
                ? '#E9D5FF' 
                : '#D8DADF',
            '--theme-divider': screen.themeColors.primaryBg === '#0B0F19' 
              ? '#374151' 
              : screen.themeColors.primaryBg === '#EBE5F9' 
                ? '#F3E8FF' 
                : '#E4E6EB',
            '--theme-hover-bg': screen.themeColors.primaryBg === '#0B0F19' 
              ? 'rgba(255,255,255,0.08)' 
              : screen.themeColors.primaryBg === '#EBE5F9' 
                ? 'rgba(217, 70, 239, 0.08)' 
                : '#F2F2F2',
            '--theme-border': screen.themeColors.primaryBg === '#0B0F19' 
              ? 'rgba(255,255,255,0.1)' 
              : screen.themeColors.primaryBg === '#EBE5F9' 
                ? 'rgba(139, 92, 246, 0.15)' 
                : 'rgba(0,0,0,0.1)',
          } as React.CSSProperties : {}}>
            
            {/* Status bar */}
            <div className="screen-status-bar" style={appState === 'MAIN_MENU' ? { color: '#FFF' } : {}}>
              <span className="status-left">{currentTime}</span>
              <div className="status-right">
                <i className="fas fa-wifi"></i>
                <i className="fas fa-signal"></i>
                <i className="fas fa-battery-three-quarters"></i>
              </div>
            </div>

            {appState === 'MAIN_MENU' ? (
              <div className="main-menu-screen">
                <div className="main-menu-header">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                    <div className="logo-icon"><i className="fas fa-brain"></i></div>
                    <h1>BÚMER</h1>
                  </div>
                  <p>Entrenamiento cognitivo interactivo</p>
                </div>
                
                <div className="level-selection-container">
                  <h3>Nivel de Complejidad</h3>
                  <div className="level-grid">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                      <button
                        key={num}
                        onClick={() => setLevel(num)}
                        className={`menu-level-btn ${level === num ? 'active' : ''}`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="play-btn-wrapper">
                  <button 
                    className="play-btn"
                    onClick={() => {
                      setAppState('PLAYING');
                      setPendingScreen(null);
                      fetchForObjective(level).then(() => {
                        setShowObjective(true);
                      });
                    }}
                  >
                    <i className="fas fa-play"></i> Iniciar
                  </button>
                </div>
              </div>
            ) : (
              <>

            {loading && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748B', gap: '1rem', background: '#F8FAFC' }}>
                <i className="fas fa-spinner fa-spin" style={{ fontSize: '2.5rem', color: '#4F46E5' }}></i>
                <span style={{ fontWeight: 600 }}>Generando interfaz...</span>
              </div>
            )}

            {error && !loading && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center', background: '#FFF5F5', color: '#C53030', gap: '1.25rem' }}>
                <i className="fas fa-triangle-exclamation" style={{ fontSize: '3rem' }}></i>
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontWeight: 800 }}>Error de Conexión</h3>
                  <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.5, opacity: 0.8 }}>{error}</p>
                </div>
                <button 
                  onClick={() => fetchScreen(level)}
                  style={{ background: '#C53030', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Reintentar Conexión
                </button>
              </div>
            )}

            {!loading && !error && screen && (
              <>
                {/* TOP NAV — Social Network fixed header */}
                {topNavComponents.map(nav => (
                  <div key={nav.id} className="social-top-nav">
                    <div className="social-nav-left">
                      <span className="social-nav-logo">{nav.label}</span>
                    </div>
                    <div className="social-nav-right">
                      {/* VERSION 3: 3-bars is the first icon */}
                      {nav.props.version === 3 && (
                        <button
                          className={`social-nav-icon-btn social-three-dots ${nav.props.isTarget ? 'is-target' : ''} ${menuOpen ? 'menu-active' : ''}`}
                          onClick={() => handleComponentClick(nav)}
                          aria-label="Menú de opciones"
                        >
                          <i className="fas fa-bars"></i>
                        </button>
                      )}

                      {/* VERSION 2: Search icon instead of 3-dots */}
                      {nav.props.version === 2 && (
                        <button className="social-nav-icon-btn" aria-label="Buscar">
                          <i className="fas fa-search"></i>
                        </button>
                      )}

                      <button className="social-nav-icon-btn" aria-label="Notificaciones">
                        <i className="fas fa-bell"></i>
                        <span className="social-nav-badge">3</span>
                      </button>
                      <button className="social-nav-icon-btn" aria-label="Messenger">
                        <i className="fab fa-facebook-messenger"></i>
                      </button>

                      {/* VERSION 1 (Default): 3-dots is on the far right */}
                      {(nav.props.version === 1 || !nav.props.version) && (
                        <button
                          className={`social-nav-icon-btn social-three-dots ${nav.props.isTarget ? 'is-target' : ''} ${menuOpen ? 'menu-active' : ''}`}
                          onClick={() => handleComponentClick(nav)}
                          aria-label="Menú de opciones"
                        >
                          <i className="fas fa-ellipsis-vertical"></i>
                        </button>
                      )}
                    </div>
                    {menuOpen && nav.props.version !== 2 && (
                      <div 
                        className="three-dots-dropdown"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="dropdown-item" onClick={handleCloseMenu}><i className="fas fa-user-plus"></i><span>Añadir amigos</span></div>
                        <div className="dropdown-item" onClick={handleCloseMenu}><i className="fas fa-bookmark"></i><span>Guardado</span></div>
                        <div className="dropdown-item" onClick={handleCloseMenu}><i className="fas fa-gear"></i><span>Configuración</span></div>
                        <div className="dropdown-item" onClick={handleCloseMenu}><i className="fas fa-circle-question"></i><span>Ayuda y soporte</span></div>
                        <div className="dropdown-divider"/>
                        <div className="dropdown-item dropdown-item--danger" onClick={handleLogoutClick}><i className="fas fa-right-from-bracket"></i><span>Cerrar sesión</span></div>
                      </div>
                    )}
                  </div>
                ))}

                {/* 1. Scrollable Body Content */}
                <div
                  className={`screen-scroll-container layout-${screen.layoutStructure}`}
                  style={topNavComponents.length > 0 ? { paddingTop: '56px' } : undefined}
                >
                  {contentComponents.map((comp) => {
                    switch (comp.type) {
                      case 'POST_CARD':
                        const postUserComments = userComments[comp.id] || [];
                        const totalComments = (comp.props.comments || 0) + postUserComments.length;

                        return (
                          <div key={comp.id} className="comp-POST_CARD">
                            <div className="post-header">
                              <div className="post-avatar">
                                {comp.props.avatarSrc ? (
                                  <img src={comp.props.avatarSrc} alt={comp.label} className="avatar-img" />
                                ) : (
                                  <i className={`fas fa-${comp.props.avatar || 'user'}`}></i>
                                )}
                              </div>
                              <div className="post-author-info">
                                <span className="post-author-name">{comp.label}</span>
                                <span className="post-time">
                                  <i className="fas fa-earth-europe"></i> {comp.props.time}
                                </span>
                              </div>
                              <button 
                                className="post-options-btn"
                                onClick={() => handlePostMenuToggle(comp.id)}
                              >
                                <i className="fas fa-ellipsis-h"></i>
                              </button>

                              {activePostMenuId === comp.id && (
                                <div className="post-options-dropdown" onClick={(e) => e.stopPropagation()}>
                                  <div className="dropdown-item" onClick={() => handlePostActionClick('send_message')}>
                                    <i className="fas fa-message"></i>
                                    <span>Enviar mensaje</span>
                                  </div>
                                  <div className="dropdown-item" onClick={() => handlePostActionClick('add_friend')}>
                                    <i className="fas fa-user-plus"></i>
                                    <span>Añadir Usuario</span>
                                  </div>
                                  <div className="dropdown-item dropdown-item--danger" onClick={() => handlePostActionClick('block_user')}>
                                    <i className="fas fa-user-slash"></i>
                                    <span>Bloquear Usuario</span>
                                  </div>
                                </div>
                              )}
                            </div>
                            <p className="post-content">{comp.props.content}</p>
                            {comp.props.hasImage && (
                              comp.props.imageSrc ? (
                                <img src={comp.props.imageSrc} alt="Post" className="post-image" />
                              ) : (
                                <div className="post-image-placeholder">
                                  <i className="fas fa-image"></i>
                                </div>
                              )
                            )}
                            <div className="post-stats">
                              <span><i className="fas fa-thumbs-up" style={{color:'#1877F2'}}></i> {comp.props.likes}</span>
                              <span>{totalComments} comentarios</span>
                            </div>
                            <div className="post-actions">
                              <button className="post-action-btn"><i className="fas fa-thumbs-up"></i> Me gusta</button>
                              <button 
                                className="post-action-btn"
                                onClick={() => handleCommentToggle(comp.id)}
                              >
                                <i className="fas fa-comment"></i> Comentar
                              </button>
                              <button className="post-action-btn"><i className="fas fa-share"></i> Compartir</button>
                            </div>

                            {/* Comment Input Panel */}
                            {activeCommentPostId === comp.id && (
                              <div className="post-comment-input-area" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="text"
                                  placeholder="Escribe un comentario..."
                                  className="comment-text-input"
                                  value={commentText}
                                  onChange={(e) => setCommentText(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handlePublishComment(comp.id);
                                    }
                                  }}
                                  autoFocus
                                />
                                <button
                                  className="comment-publish-btn"
                                  onClick={() => handlePublishComment(comp.id)}
                                  disabled={!commentText.trim()}
                                >
                                  Publicar
                                </button>
                              </div>
                            )}

                            {/* Existing & User Added Comments */}
                            {postUserComments.length > 0 && (
                              <div className="post-user-comments-list">
                                {postUserComments.map((text, idx) => (
                                  <div key={idx} className="user-comment-bubble">
                                    <div className="comment-bubble-avatar">
                                      <i className="fas fa-circle-user"></i>
                                    </div>
                                    <div className="comment-bubble-content">
                                      <div className="comment-bubble-author">Tú</div>
                                      <p>{text}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );

                      case 'HEADER_MISSION':
                        return (
                          <div 
                            key={comp.id} 
                            className={`comp-HEADER_MISSION`}
                          >
                            <div className="header-title-container">
                              {comp.props.icon && (
                                <i className={`fas fa-${comp.props.icon} header-icon`}></i>
                              )}
                              <h3 className={`hierarchy-${comp.props.hierarchy || 'medium'}`}>
                                {comp.label}
                              </h3>
                            </div>
                          </div>
                        );

                      case 'TEXT_BLOCK':
                        return (
                          <p 
                            key={comp.id} 
                            className={`comp-TEXT_BLOCK hierarchy-${comp.props.hierarchy || 'medium'}`}
                          >
                            {comp.label}
                          </p>
                        );

                      case 'BUTTON':
                        return (
                          <button
                            key={comp.id}
                            onClick={() => handleComponentClick(comp)}
                            className={`comp-BUTTON intent-${comp.props.intent || ''} hierarchy-${comp.props.hierarchy || 'medium'}`}
                          >
                            {comp.props.icon && (
                              <i className={`fas fa-${comp.props.icon}`}></i>
                            )}
                            <span>{comp.label}</span>
                          </button>
                        );

                      case 'CARD_PRODUCT':
                        // Renders a high fidelity product card
                        const hasIconOnly = !comp.props.placeholder && comp.props.icon;
                        const actionBtnLabel = comp.props.placeholder || 'Añadir';

                        return (
                          <div 
                            key={comp.id} 
                            className="comp-CARD_PRODUCT"
                            onClick={() => handleComponentClick(comp)}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="card-top">
                              <div className="card-img-placeholder">
                                <i className={`fas fa-${comp.props.icon || 'gift'}`}></i>
                              </div>
                              <h4 className="product-title">{comp.label}</h4>
                              {comp.props.price && (
                                <span className="product-price">{comp.props.price}</span>
                              )}
                            </div>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation(); // prevent double clicking
                                handleComponentClick(comp);
                              }}
                              className={`product-action-btn ${hasIconOnly ? 'only-icon' : ''}`}
                            >
                              {comp.props.icon && !hasIconOnly && (
                                <i className={`fas fa-${comp.props.icon}`}></i>
                              )}
                              {hasIconOnly ? (
                                <i className={`fas fa-${comp.props.icon}`}></i>
                              ) : (
                                <span>{actionBtnLabel}</span>
                              )}
                            </button>
                          </div>
                        );

                      case 'SEARCH_BAR':
                        return (
                          <div key={comp.id} className="comp-SEARCH_BAR">
                            <i className="fas fa-search"></i>
                            <span>{comp.label || comp.props.placeholder}</span>
                          </div>
                        );

                      case 'FORM_INPUT':
                        return (
                          <div key={comp.id} className="comp-FORM_INPUT">
                            <label>{comp.label}</label>
                            <div className="input-wrapper">
                              <span>{comp.props.placeholder}</span>
                            </div>
                          </div>
                        );

                      default:
                        return null;
                    }
                  })}
                </div>

                {/* 3. Navigation Bar Bottom (absolute position inside phone screen) */}
                {bottomNavComponents.length > 0 && (
                  <div className="simulator-nav-bar-bottom">
                    {bottomNavComponents.map((comp, idx) => (
                      <div 
                        key={comp.id}
                        onClick={() => handleComponentClick(comp)}
                        className={`nav-item ${idx === 0 ? 'active' : ''} ${comp.props.isTarget && menuOpen ? 'menu-active' : ''}`}
                      >
                        {comp.props.icon && (
                          <i className={`fas fa-${comp.props.icon}`}></i>
                        )}
                        <span>{comp.label}</span>

                        {comp.props.isTarget && menuOpen && (
                          <div 
                            className="three-dots-dropdown bottom-dropdown"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="dropdown-item" onClick={handleCloseMenu}><i className="fas fa-user-plus"></i><span>Añadir amigos</span></div>
                            <div className="dropdown-item" onClick={handleCloseMenu}><i className="fas fa-bookmark"></i><span>Guardado</span></div>
                            <div className="dropdown-item" onClick={handleCloseMenu}><i className="fas fa-gear"></i><span>Configuración</span></div>
                            <div className="dropdown-item" onClick={handleCloseMenu}><i className="fas fa-circle-question"></i><span>Ayuda y soporte</span></div>
                            <div className="dropdown-divider"/>
                            <div className="dropdown-item dropdown-item--danger" onClick={handleLogoutClick}><i className="fas fa-right-from-bracket"></i><span>Cerrar sesión</span></div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Persistent Floating Assistive "Ver Objetivo" Button */}
                {/* Persistent Floating Assistive "Ver Objetivo" Button */}
                {!showObjective && !success && (
                  <button 
                    className="floating-objective-btn"
                    onClick={() => {
                      setPendingScreen(screen);
                      setShowObjective(true);
                    }}
                    title="Ver objetivo de la misión"
                    aria-label="Ver objetivo de la misión"
                  >
                    <i className="fas fa-bullseye"></i>
                    <span>Ver Objetivo</span>
                  </button>
                )}
              </>
            )}

            {/* 4. SUCCESS OVERLAY SCREEN */}
            {success && (
                  <div className="success-screen-overlay">
                    <div className="success-header-group">
                      <div className="success-badge">
                        <i className="fas fa-check"></i>
                      </div>
                      <h2>¡Correcto!</h2>
                    </div>
                    <button 
                      className="next-level-btn"
                      onClick={handleNextInterface}
                    >
                      <span>Siguiente Interfaz</span>
                      <i className="fas fa-arrow-right"></i>
                    </button>
                  </div>
                )}

                {/* 5. OBJETIVO SCREEN (shown before new interface loads) */}
                {showObjective && (
                  <div className="objective-screen-overlay">

                    {/* Objective content — centered */}
                    <div className="objective-content-group">
                      <div className="objective-card">
                        <div className="objective-icon">
                          <i className="fas fa-bullseye"></i>
                        </div>
                        <div className="objective-label">Objetivo</div>

                        {objectiveLoading ? (
                          <div className="objective-loading">
                            <i className="fas fa-spinner fa-spin"></i>
                          </div>
                        ) : pendingScreen ? (
                          <>
                            <p className="objective-text">
                              {pendingScreen.missionText.replace(/\.$/, '')}
                            </p>
                            <div className="objective-meta">
                              <span className="objective-level-badge">Nivel {pendingScreen.complexityLevel}</span>
                              <span className="objective-template">{pendingScreen.appTemplate}</span>
                            </div>
                          </>
                        ) : (
                          <p className="objective-text objective-text--hint">Cargando objetivo...</p>
                        )}
                      </div>
                    </div>
                    <button
                      className="objective-start-btn"
                      onClick={handleStartFromObjective}
                      disabled={!pendingScreen || objectiveLoading}
                    >
                      <i className="fas fa-play"></i>
                      <span>¡Entendido, Empezar!</span>
                    </button>
                    <button
                      className="objective-back-btn"
                      onClick={() => {
                        setShowObjective(false);
                        setAppState('MAIN_MENU');
                        setPendingScreen(null);
                        setScreen(null);
                      }}
                    >
                      <i className="fas fa-arrow-left"></i>
                      <span>Volver a Inicio</span>
                    </button>
                  </div>
                )}
              </>
            )}

            <div className="home-indicator"></div>
          </div>
        </div>
      </div>

    </div>
  );
}
