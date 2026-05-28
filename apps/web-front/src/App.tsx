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
  const [currentTime, setCurrentTime] = useState<string>('12:45');

  // Interactivity states for Level 1 expanded objectives
  const [activePostMenuId, setActivePostMenuId] = useState<string | null>(null);
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState<string>('');
  const [userComments, setUserComments] = useState<Record<string, string[]>>({});

  // Interactivity states for Level 3 Delivery application
  const [selectedDeliveryProduct, setSelectedDeliveryProduct] = useState<UIComponent | null>(null);
  const [deliveryCart, setDeliveryCart] = useState<UIComponent[]>([]);
  const [showDeliveryCart, setShowDeliveryCart] = useState<boolean>(false);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);
  const [deliveryCustomizations, setDeliveryCustomizations] = useState<Record<string, boolean>>({});
  const [deliverySearchQuery, setDeliverySearchQuery] = useState<string>('');
  const [selectedDeliveryCategory, setSelectedDeliveryCategory] = useState<string>('');

  // Interactivity states for Level 5 & 6 Banking application
  const [bankingTab, setBankingTab] = useState<'INICIO' | 'CARDS' | 'TRANSFERS' | 'HISTORY' | 'BIZUM'>('INICIO');
  const [balanceVisible, setBalanceVisible] = useState<boolean>(true);
  const [transferAmount, setTransferAmount] = useState<string>('');
  const [transferTarget, setTransferTarget] = useState<string>('');
  const [activeBankMenu, setActiveBankMenu] = useState<boolean>(false);
  const [bankAlert, setBankAlert] = useState<string | null>(null);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [completedTransfers, setCompletedTransfers] = useState<{target: string, amount: string, date: string}[]>([]);

  // Bizum and Card locking states
  const [cardLocked, setCardLocked] = useState<boolean>(false);
  const [bizumTarget, setBizumTarget] = useState<string>('');
  const [bizumConcept, setBizumConcept] = useState<string>('');
  const [bizumAmount, setBizumAmount] = useState<string>('');
  const [bizumError, setBizumError] = useState<string | null>(null);

  // Clock App states
  const [clockTab, setClockTab] = useState<'ALARM' | 'WORLD' | 'TIMER' | 'STOPWATCH'>('ALARM');
  const [alarmActive, setAlarmActive] = useState<boolean>(false);
  const [worldCities, setWorldCities] = useState<{name: string, timeOffset: number}[]>([{name: 'Madrid', timeOffset: 0}]);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [stopwatchRunning, setStopwatchRunning] = useState<boolean>(false);
  const [timerTime, setTimerTime] = useState<number>(300); // 5 mins
  const [stopwatchTime, setStopwatchTime] = useState<number>(0);
  const [showAddCityModal, setShowAddCityModal] = useState<boolean>(false);
  const [newCityName, setNewCityName] = useState<string>('');
  const [dummyAlarmsActive, setDummyAlarmsActive] = useState<Record<number, boolean>>({});

  // Flight App states
  const [flightTab, setFlightTab] = useState<'SEARCH' | 'TRIPS' | 'BOARDING' | 'PROFILE' | 'EXPLORE' | 'NOTIFICATIONS' | 'MILES' | 'CARS'>('SEARCH');
  const [flightOrigin, setFlightOrigin] = useState<string>('Madrid (MAD)');
  const [flightDest, setFlightDest] = useState<string>('');
  const [flightDate, setFlightDate] = useState<string>('2026-06-15');
  const [flightReturnDate, setFlightReturnDate] = useState<string>('2026-06-20');
  const [flightSearchStep, setFlightSearchStep] = useState<'FORM' | 'RESULTS' | 'CHECKOUT'>('FORM');
  const [flightPaymentMethod, setFlightPaymentMethod] = useState<'CARD' | 'PAYPAL'>('CARD');
  const [showFlightBaggageModal, setShowFlightBaggageModal] = useState<boolean>(false);
  const [flightBaggageAdded, setFlightBaggageAdded] = useState<boolean>(false);
  const [flightBooked, setFlightBooked] = useState<boolean>(false);
  
  // New Complex Flight App states
  const [flightTripType, setFlightTripType] = useState<'IDA_VUELTA' | 'SOLO_IDA' | 'MULTIDESTINO'>('IDA_VUELTA');
  const [flightPassengers, setFlightPassengers] = useState<number>(1);
  const [flightClass, setFlightClass] = useState<'TURISTA' | 'BUSINESS' | 'PRIMERA'>('TURISTA');
  const [showFlightMenu, setShowFlightMenu] = useState<boolean>(false);
  const [showExtraOptions, setShowExtraOptions] = useState<boolean>(false);

  // Independent rotation state tracking
  const [currentVerIndex, setCurrentVerIndex] = useState<number>(0);
  const [currentObjIndex, setCurrentObjIndex] = useState<number>(0);
  const [pendingVerIndex, setPendingVerIndex] = useState<number>(0);
  const [pendingObjIndex, setPendingObjIndex] = useState<number>(0);

  // Decoupled clean interface count per level
  const getVersionsCountForLevel = (lv: number): number => {
    if (lv === 1) return 3; // 3 visual styles
    if (lv === 2) return 3; // 3 clock visual styles
    if (lv === 3) return 2; // 2 delivery themes
    if (lv === 4) return 2; // 2 Banking palettes
    if (lv === 5) return 3; // 3 Flight app themes (Minimal, Glass, Brutal)
    return 2;
  };

  const getObjectivesCountForLevel = (lv: number): number => {
    if (lv === 1) return 3; // 3 objectives
    if (lv === 2) return 4; // 4 clock objectives
    if (lv === 3) return 12; // 12 target food items
    if (lv === 4) return 5; // 5 Banking objectives: 2 transfers + block card + Bizum + check PIN
    if (lv === 5) return 3; // 3 Flight app objectives
    return 2;
  };

  // Peeks at the next visual and objective indices, applying strict pool exclusion
  const peekNextIndices = (lv: number): { ver: number, obj: number } => {
    let lastVer = -1;
    let lastObj = -1;
    try {
      lastVer = parseInt(localStorage.getItem(`bumer_last_ver_lv_${lv}`) || '-1', 10);
      lastObj = parseInt(localStorage.getItem(`bumer_last_obj_lv_${lv}`) || '-1', 10);
    } catch (e) {
      console.error(e);
    }

    const numVersions = getVersionsCountForLevel(lv);
    const numObjectives = getObjectivesCountForLevel(lv);

    let nextVer = 0;
    if (numVersions > 1) {
      const verPool = [];
      for (let i = 0; i < numVersions; i++) {
        if (i !== lastVer) verPool.push(i);
      }
      nextVer = verPool[Math.floor(Math.random() * verPool.length)];
    }

    let nextObj = 0;
    if (numObjectives > 1) {
      const objPool = [];
      for (let i = 0; i < numObjectives; i++) {
        if (i !== lastObj) objPool.push(i);
      }
      nextObj = objPool[Math.floor(Math.random() * objPool.length)];
    }

    return { ver: nextVer, obj: nextObj };
  };

  // Commits the indices to localStorage as the last played reference
  const commitNextIndices = (lv: number, ver: number, obj: number): void => {
    try {
      localStorage.setItem(`bumer_last_ver_lv_${lv}`, ver.toString());
      localStorage.setItem(`bumer_last_obj_lv_${lv}`, obj.toString());
    } catch (e) {
      console.error(e);
    }
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

  // Clock effects for timer and stopwatch
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (timerRunning && timerTime > 0) {
      interval = setInterval(() => {
        setTimerTime(prev => prev - 1);
      }, 1000);
    } else if (timerTime === 0) {
      setTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerTime]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (stopwatchRunning) {
      interval = setInterval(() => {
        setStopwatchTime(prev => prev + 10);
      }, 10);
    }
    return () => clearInterval(interval);
  }, [stopwatchRunning]);

  // Fetch procedurally-generated screen from Fastify backend
  const fetchScreen = async (selectedLevel: number, verIdx: number, objIdx: number) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    setMenuOpen(false);
    setActivePostMenuId(null);
    setActiveCommentPostId(null);
    setCommentText('');
    setUserComments({});
    setSelectedDeliveryProduct(null);
    setDeliveryCart([]);
    setShowDeliveryCart(false);
    setDeliveryError(null);
    setDeliveryCustomizations({});
    setDeliverySearchQuery('');
    setSelectedDeliveryCategory('');
    
    // Reset Banking App States
    setBankingTab('INICIO');
    setBalanceVisible(true);
    setTransferAmount('');
    setTransferTarget('');
    setActiveBankMenu(false);
    setBankAlert(null);
    setTransferError(null);
    setCardLocked(false);
    setBizumTarget('');
    setBizumConcept('');
    setBizumAmount('');
    setBizumError(null);
    
    // Reset Clock App States
    setClockTab('ALARM');
    setAlarmActive(false);
    setWorldCities([{name: 'Madrid', timeOffset: 0}]);
    setTimerRunning(false);
    setStopwatchRunning(false);
    setTimerTime(300);
    setStopwatchTime(0);

    // Reset Flight App States
    setFlightTab('SEARCH');
    setFlightOrigin('Madrid (MAD)');
    setFlightDest('');
    setFlightDate('2026-06-15');
    setShowFlightBaggageModal(false);
    setFlightBaggageAdded(false);
    setFlightBooked(false);
    setFlightTripType('IDA_VUELTA');
    setFlightPassengers(1);
    setFlightClass('TURISTA');
    setShowFlightMenu(false);
    setShowExtraOptions(false);
    
    try {
      commitNextIndices(selectedLevel, verIdx, objIdx);
      setCurrentVerIndex(verIdx);
      setCurrentObjIndex(objIdx);
      // Calling our Fastify server (proxied in Vite config)
      const res = await fetch(`/api/screen/generate?level=${selectedLevel}&versionIndex=${verIdx}&objectiveIndex=${objIdx}`);
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
  const fetchForObjective = async (selectedLevel: number, verIdx: number, objIdx: number) => {
    setPendingScreen(null);
    setObjectiveLoading(true);
    try {
      const res = await fetch(`/api/screen/generate?level=${selectedLevel}&versionIndex=${verIdx}&objectiveIndex=${objIdx}`);
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
    setSelectedDeliveryProduct(null);
    setDeliveryCart([]);
    setShowDeliveryCart(false);
    setDeliveryError(null);
    setDeliveryCustomizations({});
    setDeliverySearchQuery('');
    setSelectedDeliveryCategory('');

    setFlightTab('SEARCH');
    setFlightOrigin('Madrid (MAD)');
    setFlightDest('');
    setFlightDate('2026-06-15');
    setShowFlightBaggageModal(false);
    setFlightBaggageAdded(false);
    setFlightBooked(false);
    setFlightTripType('IDA_VUELTA');
    setFlightPassengers(1);
    setFlightClass('TURISTA');
    setShowFlightMenu(false);
    setShowExtraOptions(false);
    setFlightSearchStep('FORM');

    // Auto-fetch with the current level so the objective text appears immediately
    const nextIdxs = peekNextIndices(level);
    setPendingVerIndex(nextIdxs.ver);
    setPendingObjIndex(nextIdxs.obj);
    fetchForObjective(level, nextIdxs.ver, nextIdxs.obj);
  };

  // Handler called when user taps "¡Entendido, Empezar!"
  const handleStartFromObjective = () => {
    if (pendingScreen) {
      if (pendingScreen !== screen) {
        // Commit the version since the user is now starting the level!
        commitNextIndices(pendingScreen.complexityLevel, pendingVerIndex, pendingObjIndex);
        setCurrentVerIndex(pendingVerIndex);
        setCurrentObjIndex(pendingObjIndex);

        setScreen(pendingScreen);
        setMenuOpen(false);
        setActivePostMenuId(null);
        setActiveCommentPostId(null);
        setCommentText('');
        setUserComments({});
        setSelectedDeliveryProduct(null);
        setDeliveryCart([]);
        setShowDeliveryCart(false);
        setDeliveryError(null);
        setDeliveryCustomizations({});
        setDeliverySearchQuery('');
        setSelectedDeliveryCategory('');

        // Reset Banking App States on load to guarantee starting on the INICIO tab
        setBankingTab('INICIO');
        setBalanceVisible(true);
        setTransferAmount('');
        setTransferTarget('');
        setActiveBankMenu(false);
        setBankAlert(null);
        setTransferError(null);
        setCardLocked(false);
        setBizumTarget('');
        setBizumConcept('');
        setBizumAmount('');
        setBizumError(null);
        
        // Reset Clock App States
        setClockTab('ALARM');
        setAlarmActive(false);
        setWorldCities([{name: 'Madrid', timeOffset: 0}]);
        setTimerRunning(false);
        setStopwatchRunning(false);
        setTimerTime(300);
        setStopwatchTime(0);

        setFlightTab('SEARCH');
        setFlightOrigin('Madrid (MAD)');
        setFlightDest('');
        setFlightDate('2026-06-15');
        setShowFlightBaggageModal(false);
        setFlightBaggageAdded(false);
        setFlightBooked(false);
        setFlightTripType('IDA_VUELTA');
        setFlightPassengers(1);
        setFlightClass('TURISTA');
        setShowFlightMenu(false);
        setShowExtraOptions(false);
        setFlightSearchStep('FORM');

        setAppState('PLAYING');
      }
      setPendingScreen(null);
    }
    setShowObjective(false);
  };

  const renderDeliveryApp = () => {
    if (!screen) return null;

    // Detect if this is the Green theme or Orange theme
    const isGreenTheme = screen.themeColors.accentColor === '#0A5C36';

    // Parse numeric value from price string
    const parsePrice = (priceStr: string) => {
      const parsed = parseFloat((priceStr || '0€').replace(/[^0-9.]/g, ''));
      return isNaN(parsed) ? 0 : parsed;
    };

    // Prices for optional customizations (Green theme)
    const CUSTOMIZATION_PRICES = {
      'Huevo frito': 2.90,
      'Langostino rebozado (Ebi Furai)': 9.90,
      'Huevo pocheado (Onsen Egg)': 8.90,
    };

    // Find the target component
    const targetComp = screen.components.find(c => c.props?.isTarget);

    // Helper to get matching icons and vendor subtitles for products
    const getProductDetails = (name: string) => {
      const lower = name.toLowerCase();
      if (lower.includes('pizza')) return { icon: 'pizza-slice', vendor: 'Por Pizza Hut', rating: '4.8', color: '#FFF3E0', imgSrc: '/delivery/pizza_pepperoni.png' };
      if (lower.includes('hamburguesa') || lower.includes('burger') || lower.includes('queso')) {
        if (lower.includes('tarta')) return { icon: 'cookie', vendor: 'Por Cheesecake Factory', rating: '4.9', color: '#FFF3E0', imgSrc: '/delivery/tarta_queso.png' };
        return { icon: 'hamburger', vendor: 'Por Burger King', rating: '4.7', color: '#E8F5E9', imgSrc: '/delivery/cheeseburger.png' };
      }
      if (lower.includes('taco')) return { icon: 'pepper-hot', vendor: 'Por Taco Bell', rating: '4.7', color: '#FCE4EC', imgSrc: '/delivery/tacos.png' };
      if (lower.includes('sushi')) return { icon: 'fish', vendor: 'Por Panda Express', rating: '4.9', color: '#E0F2F1', imgSrc: '/delivery/sushi.png' };
      if (lower.includes('ensalada') || lower.includes('salad') || lower.includes('césar')) return { icon: 'leaf', vendor: 'Por FreshSalad', rating: '4.6', color: '#E8F5E9', imgSrc: '/delivery/caesar_salad.png' };
      if (lower.includes('helado') || lower.includes('ice') || lower.includes('vainilla')) return { icon: 'ice-cream', vendor: 'Por Gelato', rating: '4.8', color: '#F3E5F5', imgSrc: '/delivery/vanilla_icecream.png' };
      if (lower.includes('cola') || lower.includes('refresco')) return { icon: 'glass-water', vendor: 'Por Coca-Cola', rating: '4.9', color: '#FFEBEE', imgSrc: '/delivery/cola.png' };
      if (lower.includes('agua')) return { icon: 'bottle-water', vendor: 'Por Bezoya', rating: '4.8', color: '#E0F7FA', imgSrc: '/delivery/agua_mineral.png' };
      if (lower.includes('coreano') || lower.includes('pollo')) return { icon: 'fire-burner', vendor: 'Por BBQ Chicken', rating: '4.9', color: '#FFF3E0', imgSrc: '/delivery/pollo_coreano.png' };
      if (lower.includes('ramen')) return { icon: 'bowl-food', vendor: 'Por Ramen Shifu', rating: '4.8', color: '#FFF8E1', imgSrc: '/delivery/ramen.png' };
      if (lower.includes('arroz')) return { icon: 'bowl-rice', vendor: 'Por Wok To Walk', rating: '4.7', color: '#E8F5E9', imgSrc: '/delivery/arroz_tres_delicias.png' };
      if (lower.includes('tarta') || lower.includes('cookie')) return { icon: 'cookie', vendor: 'Por Cheesecake Factory', rating: '4.9', color: '#FFF3E0', imgSrc: '/delivery/tarta_queso.png' };
      return { icon: 'utensils', vendor: 'Por FoodHouse', rating: '4.5', color: '#ECEFF1', imgSrc: '' };
    };

    // Calculate Subtotal factoring in selected customizations
    const subtotal = deliveryCart.reduce((sum, item) => {
      const itemPrice = (item as any).finalPrice !== undefined 
        ? (item as any).finalPrice 
        : parsePrice(item.props?.price || '0€');
      return sum + itemPrice;
    }, 0);
    const deliveryFee = deliveryCart.length > 0 ? 2.00 : 0.00;
    const totalAmount = subtotal + deliveryFee;

    // ── 1. RENDER CART SCREEN ────────────────────────────────────────────────
    if (showDeliveryCart) {
      const handleCheckout = () => {
        // Find if target food item is in the cart
        const hasTarget = deliveryCart.some(item => item.props?.isTarget);
        if (hasTarget) {
          setSuccess(true);
          setShowDeliveryCart(false);
        } else {
          const targetName = targetComp ? targetComp.label : 'el platillo indicado';
          setDeliveryError(`El objetivo es agregar "${targetName}" al carrito antes de realizar el Checkout.`);
          setTimeout(() => setDeliveryError(null), 4000);
        }
      };

      const handleRemoveFromCart = (idx: number) => {
        const newCart = [...deliveryCart];
        newCart.splice(idx, 1);
        setDeliveryCart(newCart);
      };

      return (
        <div className={`delivery-screen cart-view ${isGreenTheme ? 'theme-dark-green' : ''}`}>
          {/* Header */}
          <div className="delivery-header">
            <button className="header-back-circle" onClick={() => setShowDeliveryCart(false)}>
              <i className="fas fa-chevron-left"></i>
            </button>
            <span className="header-title">Carrito</span>
            <button className="header-menu-btn"><i className="fas fa-ellipsis-vertical"></i></button>
          </div>

          {/* Error Message Toast */}
          {deliveryError && (
            <div className="delivery-error-toast">
              <i className="fas fa-circle-exclamation"></i>
              <span>{deliveryError}</span>
            </div>
          )}

          {/* Scrollable Items list */}
          <div className="cart-items-container">
            {deliveryCart.length === 0 ? (
              <div className="cart-empty-state">
                <div className="empty-cart-icon"><i className="fas fa-shopping-basket"></i></div>
                <h3>Tu carrito está vacío</h3>
                <p>Vuelve al menú principal y añade tu platillo favorito.</p>
              </div>
            ) : (
              deliveryCart.map((item, idx) => {
                const details = getProductDetails(item.label);
                return (
                  <div key={`${item.id}-${idx}`} className="cart-item-card">
                    <div className="cart-item-img" style={details.imgSrc ? undefined : { backgroundColor: details.color }}>
                      {details.imgSrc ? (
                        <img src={details.imgSrc} alt={item.label} className="cart-item-image-tag" />
                      ) : (
                        <i className={`fas fa-${details.icon}`}></i>
                      )}
                    </div>
                    <div className="cart-item-info">
                      <div className="cart-item-name-row">
                        <span className="cart-item-name">{item.label}</span>
                        <span className="cart-item-rating">★ {details.rating}</span>
                      </div>
                      <span className="cart-item-vendor">{details.vendor}</span>

                      {/* Render customizations badges if present */}
                      {(item as any).selectedCustoms && (item as any).selectedCustoms.length > 0 && (
                        <div className="cart-item-customs-badges" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', margin: '4px 0' }}>
                          {(item as any).selectedCustoms.map((customName: string) => (
                            <span key={customName} className="custom-badge" style={{ fontSize: '0.625rem', fontWeight: 700, backgroundColor: 'rgba(var(--theme-accent-rgb), 0.08)', color: 'var(--theme-accent)', padding: '1px 6px', borderRadius: '4px' }}>
                              + {customName}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="cart-item-price-row">
                        <span className="cart-item-price">
                          {(item as any).finalPrice !== undefined 
                            ? `${(item as any).finalPrice.toFixed(2)}€` 
                            : (item.props?.price || '0.00€')}
                        </span>
                        <div className="cart-item-stepper">
                          <button className="stepper-minus" onClick={() => handleRemoveFromCart(idx)}><i className="fas fa-minus"></i></button>
                          <span className="stepper-value">1</span>
                          <button className="stepper-plus"><i className="fas fa-plus"></i></button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Voucher input */}
          <div className="voucher-input-wrapper">
            <div className="voucher-input-inner">
              <i className="fas fa-ticket-simple voucher-icon"></i>
              <input type="text" placeholder="Ingresar código de descuento" readOnly value="" />
              <button className="voucher-go-btn"><i className="fas fa-chevron-right"></i></button>
            </div>
          </div>

          {/* Price breakdown */}
          <div className="price-summary-block">
            <div className="summary-row">
              <span className="summary-label">Subtotal:</span>
              <span className="summary-val">{subtotal.toFixed(2)}€</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Costo de Envío:</span>
              <span className="summary-val">{deliveryFee.toFixed(2)}€</span>
            </div>
            <div className="summary-divider"></div>
            <div className="summary-row total-row">
              <span className="summary-label">Monto Total:</span>
              <span className="summary-val">{totalAmount.toFixed(2)}€</span>
            </div>
          </div>

          {/* Checkout Bar */}
          <div className="checkout-bar-footer">
            <div className="checkout-price-col">
              <span className="checkout-price-label">Precio</span>
              <span className="checkout-price-val">{totalAmount.toFixed(2)}€</span>
            </div>
            <button className="checkout-pill-btn" onClick={handleCheckout}>
              Pagar
            </button>
          </div>
        </div>
      );
    }

    // ── 2. RENDER PRODUCT DETAIL SCREEN ──────────────────────────────────────
    if (selectedDeliveryProduct) {
      const details = getProductDetails(selectedDeliveryProduct.label);

      // Total computed price for this item including active customizations
      const itemCustomizationsPrice = Object.keys(deliveryCustomizations)
        .filter(k => deliveryCustomizations[k])
        .reduce((sum, k) => sum + (CUSTOMIZATION_PRICES[k as keyof typeof CUSTOMIZATION_PRICES] || 0), 0);
      const computedItemPrice = parsePrice(selectedDeliveryProduct.props?.price || '0€') + itemCustomizationsPrice;

      const handleAddToCart = () => {
        // Build the item payload with chosen options
        const itemWithCustoms = {
          ...selectedDeliveryProduct,
          cartId: `${selectedDeliveryProduct.id}-${Date.now()}`,
          selectedCustoms: Object.keys(deliveryCustomizations).filter(k => deliveryCustomizations[k]),
          finalPrice: computedItemPrice
        };
        setDeliveryCart([...deliveryCart, itemWithCustoms]);
        setSelectedDeliveryProduct(null);
        setDeliveryCustomizations({}); // clear customizations for next choice
        setShowDeliveryCart(true); // Open the cart view immediately
      };

      return (
        <div className={`delivery-screen detail-view ${isGreenTheme ? 'theme-dark-green' : ''}`}>
          {/* Header */}
          <div className="delivery-header">
            <button className="header-back-circle" onClick={() => setSelectedDeliveryProduct(null)}>
              <i className="fas fa-chevron-left"></i>
            </button>
            <span className="header-title">Detalle</span>
            <button className="header-menu-btn"><i className="fas fa-ellipsis-vertical"></i></button>
          </div>

          {/* Hero Image Section */}
          <div className="detail-hero-section">
            {details.imgSrc ? (
              <img src={details.imgSrc} alt={selectedDeliveryProduct.label} className="detail-hero-image-tag" />
            ) : (
              <div className="detail-hero-icon-container" style={{ background: `linear-gradient(135deg, ${details.color} 0%, var(--theme-accent, #EA580C) 100%)` }}>
                <i className={`fas fa-${details.icon} detail-hero-icon`}></i>
              </div>
            )}
          </div>

          {/* Details Content Card */}
          <div className="detail-content-card">
            <div className="detail-title-row">
              <h2 className="detail-title">{selectedDeliveryProduct.label}</h2>
              <span className="detail-rating"><i className="fas fa-star"></i> {details.rating}</span>
            </div>
            <span className="detail-vendor">{details.vendor}</span>

            {/* Chef Info Row */}
            <div className="detail-chef-row">
              <div className="chef-avatar">
                <i className="fas fa-circle-user"></i>
              </div>
              <div className="chef-info">
                <span className="chef-name">Mitchel Santnar</span>
                <span className="chef-id">ID: 13256626</span>
              </div>
              <div className="chef-actions">
                <button className="chef-circle-btn"><i className="fas fa-message"></i></button>
                <button className="chef-circle-btn"><i className="fas fa-phone"></i></button>
              </div>
            </div>

            {/* Description */}
            <div className="detail-desc-block">
              <h3>Descripción</h3>
              <p>
                Deliciosos ingredientes frescos de primera calidad. Preparado al momento siguiendo la receta auténtica de {details.vendor} para garantizar todo su sabor y aroma crujiente. Entregado en condiciones óptimas para su consumo inmediato.
              </p>
            </div>

            {/* Customization Checklist for Green Theme */}
            {isGreenTheme && (
              <div className="detail-customization-section">
                <h3>
                  <span>Añadir extras</span>
                  <span className="custom-required-tag">Opcional</span>
                </h3>
                <div className="customization-list">
                  {Object.keys(CUSTOMIZATION_PRICES).map((optionName) => {
                    const priceDiff = CUSTOMIZATION_PRICES[optionName as keyof typeof CUSTOMIZATION_PRICES];
                    const isChecked = !!deliveryCustomizations[optionName];
                    const toggleOption = () => {
                      setDeliveryCustomizations(prev => ({
                        ...prev,
                        [optionName]: !prev[optionName]
                      }));
                    };
                    return (
                      <div 
                        key={optionName} 
                        className="customization-row" 
                        onClick={toggleOption}
                      >
                        <div className="custom-label-group">
                          <div className={`custom-checkbox-mock ${isChecked ? 'checked' : ''}`}>
                            <i className="fas fa-check"></i>
                          </div>
                          <span className="custom-item-name">{optionName}</span>
                        </div>
                        <span className="custom-item-price">+{priceDiff.toFixed(2)}€</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Delivery Info Badges */}
            <div className="detail-info-badges">
              <div className="detail-badge-pill">
                <i className="fas fa-motorcycle"></i>
                <div className="badge-pill-text">
                  <span className="badge-pill-title">Tiempo de Entrega</span>
                  <span className="badge-pill-desc">25 min</span>
                </div>
              </div>
              <div className="detail-badge-pill">
                <i className="fas fa-truck-fast"></i>
                <div className="badge-pill-text">
                  <span className="badge-pill-title">Tipo de Envío</span>
                  <span className="badge-pill-desc">Exprés</span>
                </div>
              </div>
            </div>
          </div>

          {/* Price & Add to Cart Footer */}
          <div className="checkout-bar-footer">
            <div className="checkout-price-col">
              <span className="checkout-price-label">Precio</span>
              <span className="checkout-price-val">
                {computedItemPrice.toFixed(2)}€
              </span>
            </div>
            <button className="checkout-pill-btn" onClick={handleAddToCart}>
              <i className="fas fa-cart-plus"></i>
              <span>Añadir al Carrito</span>
            </button>
          </div>
        </div>
      );
    }

    // Map food names to standard category labels
    const getCategoryForFood = (comp: UIComponent): string => {
      if (comp.props?.category) return comp.props.category;
      
      const name = comp.label;
      const lower = name.toLowerCase();
      if (lower.includes('pizza')) return 'Pizzas';
      if (lower.includes('hamburguesa') || lower.includes('burger') || lower.includes('queso')) {
        if (lower.includes('tarta')) return 'Postres';
        return 'Hamburguesas';
      }
      if (lower.includes('taco') || lower.includes('alitas') || lower.includes('ensalada') || lower.includes('salad') || lower.includes('césar')) return 'Occidental';
      if (lower.includes('sushi') || lower.includes('salmón') || lower.includes('ramen') || lower.includes('gyoza') || lower.includes('japón')) return 'Japonesa';
      if (lower.includes('corea') || lower.includes('kimchi') || lower.includes('bibimbap')) return 'Coreana';
      if (lower.includes('fideos') || lower.includes('arroz') || lower.includes('bao') || lower.includes('oriental')) return 'Oriental';
      if (lower.includes('helado') || lower.includes('tarta') || lower.includes('ice') || lower.includes('postre') || lower.includes('vainilla') || lower.includes('brownie')) return 'Postres';
      if (lower.includes('refresco') || lower.includes('agua') || lower.includes('zumo') || lower.includes('cola') || lower.includes('bebida')) return 'Bebidas';
      return 'Oriental'; // Default fallback
    };

    // ── 3. RENDER HOME SCREEN ────────────────────────────────────────────────
    const productComponents = screen.components
      .filter(c => c.type === 'CARD_PRODUCT')
      .filter(comp => comp.label.toLowerCase().includes(deliverySearchQuery.toLowerCase()))
      .filter(comp => {
        if (!isGreenTheme || !selectedDeliveryCategory) return true;
        return getCategoryForFood(comp) === selectedDeliveryCategory;
      });

    return (
      <div className={`delivery-screen home-view ${isGreenTheme ? 'theme-dark-green' : ''}`}>
        {/* Top Header */}
        <div className="home-top-header" style={isGreenTheme ? { padding: '0 1.5rem' } : undefined}>
          <div className="branding-title" style={isGreenTheme ? { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' } : { display: 'flex', alignItems: 'center' }}>
            {isGreenTheme ? (
              <>
                <span style={{ fontSize: '4.2rem', fontWeight: 900, color: '#FFFFFF', lineHeight: 1.1 }}>Búmer</span>
                <span style={{ fontSize: '4.2rem', fontWeight: 900, color: '#00E676', lineHeight: 1.1 }}>Food</span>
              </>
            ) : (
              <>
                <span style={{ fontSize: '1.45rem', fontWeight: 900, letterSpacing: '-0.5px', color: '#0F172A' }}>Comida</span>
                <span style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--theme-accent, #EA580C)' }}>Fast</span>
                <span style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--theme-accent, #EA580C)', marginLeft: '1px' }}>.</span>
              </>
            )}
          </div>
          {!isGreenTheme && (
            <button className="cart-badge-btn" onClick={() => setShowDeliveryCart(true)}>
              <i className="fas fa-shopping-basket"></i>
              {deliveryCart.length > 0 && (
                <span className="cart-badge-count">{deliveryCart.length}</span>
              )}
            </button>
          )}
        </div>

        {/* Scrollable interior */}
        <div className="home-scroll-body">
          {/* Search bar & Filter (ComidaFast - Naranja) */}
          {!isGreenTheme && (
            <div className="search-filter-wrapper">
              <div className="search-input-inner">
                <i className="fas fa-search search-lens"></i>
                <input 
                  type="text" 
                  placeholder="Buscar comida, almacén..." 
                  value={deliverySearchQuery}
                  onChange={(e) => setDeliverySearchQuery(e.target.value)}
                />
              </div>
              <button className="filter-orange-btn">
                <i className="fas fa-sliders"></i>
              </button>
            </div>
          )}

          {/* New Premium Responsive Hero Banner (div.hero-baner) */}
          {isGreenTheme && (
            <div className="hero-baner">
              <div className="hero-text-side" style={{ width: '100%' }}>
                <h2 className="hero-headline" style={{ textAlign: 'center', width: '100%' }}>
                  <span style={{ display: 'block', whiteSpace: 'nowrap' }}>¡SABOR GOURMET</span>
                  <span style={{ display: 'block', whiteSpace: 'nowrap' }}>EN TU MESA!</span>
                </h2>
              </div>
            </div>
          )}
          {/* Categories Section (BúmerFood - Verde) */}
          {isGreenTheme && (
            <>
              <div className="section-header">
                <span className="section-title">Categorías</span>
                <span className="section-see-all" onClick={() => setSelectedDeliveryCategory('')} style={{ cursor: 'pointer' }}>Ver Todo</span>
              </div>

              <div className="categories-circular-grid">
                {[
                  { name: 'Bebidas', icon: 'glass-water' },
                  { name: 'Pizzas', icon: 'pizza-slice' },
                  { name: 'Hamburguesas', icon: 'hamburger' },
                  { name: 'Postres', icon: 'ice-cream' },
                  { name: 'Occidental', icon: 'drumstick-bite' },
                  { name: 'Oriental', icon: 'bowl-rice' },
                  { name: 'Coreana', icon: 'fire-burner' },
                  { name: 'Japonesa', icon: 'shrimp' },
                ].map((cat) => {
                  const isActive = selectedDeliveryCategory === cat.name;
                  const toggleCategory = () => {
                    if (isActive) {
                      setSelectedDeliveryCategory('');
                    } else {
                      setSelectedDeliveryCategory(cat.name);
                    }
                  };
                  return (
                    <div key={cat.name} className="category-circle-item" onClick={toggleCategory} style={{ cursor: 'pointer' }}>
                      <div className={`circle-wrapper ${isActive ? 'active' : ''}`}>
                        <i className={`fas fa-${cat.icon}`}></i>
                      </div>
                      <span>{cat.name}</span>
                    </div>
                  );
                })}
              </div>

              {/* Search bar & Filter (BúmerFood - Verde, sit below categories grid) */}
              <div className="search-filter-wrapper" style={{ marginBottom: '1.2rem' }}>
                <div className="search-input-inner">
                  <i className="fas fa-search search-lens"></i>
                  <input 
                    type="text" 
                    placeholder="Buscar comida, almacén..." 
                    value={deliverySearchQuery}
                    onChange={(e) => setDeliverySearchQuery(e.target.value)}
                  />
                </div>
                <button className="filter-orange-btn">
                  <i className="fas fa-sliders"></i>
                </button>
              </div>
            </>
          )}

          {/* Picks For You List / Grid */}
          <div className="section-header">
            <span className="section-title">Recomendado para ti</span>
            <span className="section-see-all">Ver Todo</span>
          </div>

          <div className="picks-for-you-grid">
            {productComponents.length === 0 ? (
              <div className="search-empty-state" style={{ textAlign: 'center', padding: '3rem 1rem', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: isGreenTheme ? 'rgba(255,255,255,0.08)' : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isGreenTheme ? '#FFFFFF' : '#94A3B8', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                  <i className="fas fa-magnifying-glass"></i>
                </div>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: isGreenTheme ? '#FFFFFF' : '#0F172A' }}>Sin resultados</h4>
                <p style={{ margin: 0, fontSize: '0.75rem', color: isGreenTheme ? 'rgba(255,255,255,0.6)' : '#94A3B8', maxWidth: '200px', lineHeight: 1.4 }}>No encontramos ningún platillo que coincida con "{deliverySearchQuery}"</p>
              </div>
            ) : (
              productComponents.map(comp => {
                const details = getProductDetails(comp.label);
                return (
                  <div key={comp.id} className="picks-card" onClick={() => setSelectedDeliveryProduct(comp)}>
                    <div className="picks-card-img" style={details.imgSrc ? undefined : { backgroundColor: details.color }}>
                      {details.imgSrc ? (
                        <img src={details.imgSrc} alt={comp.label} className="picks-card-image-tag" />
                      ) : (
                        <i className={`fas fa-${details.icon} picks-card-icon`}></i>
                      )}
                      <span className="picks-rating-badge">★ {details.rating}</span>
                      <button className="picks-heart-btn" onClick={(e) => e.stopPropagation()}><i className="fas fa-heart"></i></button>
                    </div>
                    <div className="picks-card-body">
                      <span className="picks-card-title">{comp.label}</span>
                      <span className="picks-card-vendor">25 min • Fácil • {details.vendor}</span>
                      <div className="picks-card-footer">
                        <span className="picks-card-price">{comp.props?.price || '0.00€'}</span>
                        <button className="picks-add-btn" onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDeliveryProduct(comp);
                        }}>
                          <i className="fas fa-plus"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Bottom Nav Bar */}
        <div className="delivery-bottom-nav">
          <div className="nav-item active">
            <i className="fas fa-house"></i>
            <span>Inicio</span>
          </div>
          <div className="nav-item" onClick={() => setShowDeliveryCart(true)}>
            <i className="fas fa-clipboard-list"></i>
            <span>Pedidos</span>
          </div>
          <div className="nav-item">
            <i className="fas fa-wallet"></i>
            <span>Pagos</span>
          </div>
          <div className="nav-item">
            <i className="fas fa-circle-user"></i>
            <span>Perfil</span>
          </div>
        </div>

      </div>
    );
  };

  const renderBankingApp = () => {
    if (!screen) return null;

    // Find the target Confirmar Transferencia button component
    const targetComp = screen.components.find(c => c.props?.isTarget);
    const targetAmount = targetComp?.props?.placeholder || '150.00';

    // Determine Bank Name based on accent color: Búmer Bank (red) vs Banco Santanboom (blue)
    const isRedTheme = screen.themeColors.accentColor === '#C53030';
    const bankName = isRedTheme ? 'Búmer Bank' : 'Banco Santanboom';

    const STATIC_TRANSACTIONS = [
      { category: 'Alimentación', label: 'Supermercado Mercadona', amount: '42,15€', date: '24/05/2026', positive: false, icon: 'cart-shopping' },
      { category: 'Entretenimiento', label: 'Suscripción Netflix', amount: '12,99€', date: '22/05/2026', positive: false, icon: 'tv' },
      { category: 'Nómina', label: 'Nómina Mensual Búmer', amount: '1.850,00€', date: '20/05/2026', positive: true, icon: 'hand-holding-dollar' },
      { category: 'Restaurantes', label: 'Restaurante El Celler', amount: '85,50€', date: '18/05/2026', positive: false, icon: 'utensils' },
      { category: 'Transferencia', label: 'Bizum Recibido - Mamá', amount: '20,00€', date: '17/05/2026', positive: true, icon: 'mobile-screen-button' },
      { category: 'Transporte', label: 'Abono Transporte Metro', amount: '10,00€', date: '15/05/2026', positive: false, icon: 'train' },
      { category: 'Servicios', label: 'Factura de Luz Iberdrola', amount: '65,20€', date: '12/05/2026', positive: false, icon: 'bolt' },
      { category: 'Reembolso', label: 'Devolución Amazon', amount: '14,99€', date: '10/05/2026', positive: true, icon: 'arrow-rotate-left' },
      { category: 'Tecnología', label: 'Tienda MediaMarkt', amount: '129,99€', date: '08/05/2026', positive: false, icon: 'laptop' },
      { category: 'Música', label: 'Suscripción Spotify', amount: '9,99€', date: '05/05/2026', positive: false, icon: 'music' },
      { category: 'Transferencia', label: 'Pago Alquiler Mensual', amount: '750,00€', date: '01/05/2026', positive: false, icon: 'house-user' },
      { category: 'Regalo', label: 'Regalo de Cumpleaños Juan', amount: '50,00€', date: '28/04/2026', positive: true, icon: 'gift' },
      { category: 'Hogar', label: 'Tienda IKEA', amount: '112,40€', date: '25/04/2026', positive: false, icon: 'chair' },
      { category: 'Salud', label: 'Farmacia Lda. García', amount: '18,75€', date: '22/04/2026', positive: false, icon: 'prescription-bottle-medical' },
      { category: 'Libros', label: 'Librería La Central', amount: '24,50€', date: '19/04/2026', positive: false, icon: 'book' },
      { category: 'Intereses', label: 'Intereses de Cuenta Ahorros', amount: '2,45€', date: '15/04/2026', positive: true, icon: 'chart-line' },
      { category: 'Moda', label: 'Tienda Zara España', amount: '59,95€', date: '10/04/2026', positive: false, icon: 'shirt' },
      { category: 'Transferencia', label: 'Bizum Enviado - Carlos', amount: '15,00€', date: '08/04/2026', positive: false, icon: 'mobile-screen-button' },
      { category: 'Ocio', label: 'Entradas Cine Yelmo', amount: '19,80€', date: '05/04/2026', positive: false, icon: 'ticket' },
      { category: 'Combustible', label: 'Gasolinera Repsol', amount: '55,00€', date: '02/04/2026', positive: false, icon: 'gas-pump' }
    ];

    const handleTabChange = (tab: 'INICIO' | 'CARDS' | 'TRANSFERS' | 'HISTORY' | 'BIZUM') => {
      setBankingTab(tab);
      setActiveBankMenu(false);
      setTransferError(null);
      setBizumError(null);
    };

    const handleToggleBalance = () => {
      setBalanceVisible(!balanceVisible);
    };

    const handleQuickTransfer = () => {
      handleTabChange('TRANSFERS');
    };

    const handleDistractorClick = (label: string) => {
      setBankAlert(`¡Alerta de Seguridad!\nHas pulsado sobre: "${label}". Este elemento es una publicidad o un distractor que intenta desviar tu atención de la misión principal de transferir exactamente ${targetAmount}€.`);
    };

    const handleQuickContactSelect = (name: string, alias: string) => {
      console.log('Contacto seleccionado:', name);
      setTransferTarget(alias);
      setTransferAmount(targetAmount); // dynamic auto fill
      setTransferError(null);
    };

    const handleToggleCardLock = () => {
      const nextLocked = !cardLocked;
      setCardLocked(nextLocked);
      setBankAlert(nextLocked ? '🔒 Tarjeta Bloqueada:\nTu tarjeta ha sido bloqueada de forma segura para evitar cargos.' : '🔓 Tarjeta Desbloqueada:\nTu tarjeta está activa y lista para operar.');
    };

    const handleBizumSubmit = () => {
      if (!bizumTarget.trim()) {
        setBizumError('Por favor, ingresa el número de teléfono o contacto del destinatario.');
        return;
      }
      if (!bizumConcept.trim()) {
        setBizumError('Por favor, ingresa el concepto del Bizum.');
        return;
      }
      if (!bizumAmount.trim()) {
        setBizumError('Por favor, ingresa el importe del Bizum.');
        return;
      }

      // Check if Bizum is active mission objective
      const isBizumMission = screen?.missionText.includes('Bizum');
      if (isBizumMission) {
        const amountClean = parseFloat(bizumAmount.trim().replace(/€/g, '').replace(/,/g, '.').replace(/ /g, ''));
        if (isNaN(amountClean) || Math.abs(amountClean - 50.00) > 0.01) {
          setBizumError('Error: El importe ingresado no coincide con el objetivo de la misión (50.00€).');
          return;
        }
      }

      // Perform Bizum
      const newTransfer = {
        target: `Bizum a: ${bizumTarget.trim()} (${bizumConcept.trim()})`,
        amount: `${parseFloat(bizumAmount).toFixed(2).replace('.', ',')}€`,
        date: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
      };
      setCompletedTransfers(prev => [newTransfer, ...prev]);
      setBizumError(null);

      // Trigger success or show modal and return
      if (isBizumMission) {
        setSuccess(true);
      } else {
        setBankAlert(`📱 Bizum Enviado:\nHas enviado ${bizumAmount}€ a ${bizumTarget} con éxito.`);
        handleTabChange('INICIO');
      }
    };

    const handleBizumCancel = () => {
      setBizumTarget('');
      setBizumConcept('');
      setBizumAmount('');
      setBizumError(null);
      handleTabChange('INICIO');
    };

    const handleConfirmTransferSubmit = () => {
      if (!transferTarget.trim()) {
        setTransferError('Por favor, ingresa el alias o CBU del destinatario.');
        return;
      }

      // Check amount dynamically
      const amountClean = parseFloat(transferAmount.trim().replace(/€/g, '').replace(/,/g, '.').replace(/ /g, ''));
      const targetAmountFloat = parseFloat(targetAmount);
      if (isNaN(amountClean) || Math.abs(amountClean - targetAmountFloat) > 0.01) {
        setTransferError(`Error: El monto ingresado no coincide con el objetivo de la misión (${targetAmount}€).`);
        return;
      }

      // Perform transfer
      const newTransfer = {
        target: transferTarget.trim(),
        amount: `${parseFloat(targetAmount).toFixed(2).replace('.', ',')}€`,
        date: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
      };
      setCompletedTransfers(prev => [newTransfer, ...prev]);
      setTransferError(null);

      // Trigger success using the target button schema
      if (targetComp) {
        handleComponentClick(targetComp);
      } else {
        setSuccess(true);
      }
    };

    return (
      <div className={`banking-screen theme-banking ${isRedTheme ? 'theme-bumer-bank' : 'theme-santanboom'}`}>
        {/* Secure Bank Header */}
        <div className="banking-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1rem', height: '60px', borderBottom: '1.5px solid var(--theme-border)', backgroundColor: 'var(--theme-surface-bg)', color: 'var(--theme-text-main)', position: 'relative' }}>
          <div className="header-branding" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 900, fontSize: '1.1rem', letterSpacing: '0.5px' }}>
            <i className="fas fa-shield-halved bank-shield-icon" style={{ color: 'var(--theme-accent)', fontSize: '1.25rem' }}></i>
            <span>{bankName.toUpperCase()}</span>
          </div>
          <button 
            className="header-dots-btn"
            onClick={() => setActiveBankMenu(!activeBankMenu)}
            aria-label="Menú bancario"
            style={{ background: 'none', border: 'none', color: 'var(--theme-text-main)', fontSize: '1.25rem', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <i className="fas fa-ellipsis-vertical"></i>
          </button>
          
          {activeBankMenu && (
            <div className="bank-menu-dropdown" style={{ position: 'absolute', top: '55px', right: '10px', backgroundColor: 'var(--theme-surface-bg)', border: '1.5px solid var(--theme-border)', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', zIndex: 999, width: '220px', overflow: 'hidden', padding: '0.5rem 0' }}>
              <div className="menu-item" onClick={() => { setActiveBankMenu(false); handleTabChange('BIZUM'); }} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', cursor: 'pointer', color: 'var(--theme-text-main)', fontSize: '0.9rem', fontWeight: 600 }}>
                <i className="fas fa-mobile-screen-button" style={{ width: '16px', color: 'var(--theme-accent)' }}></i>
                <span>Hacer Bizum</span>
              </div>
              <div className="menu-item" onClick={() => { setActiveBankMenu(false); setBankAlert('🔒 Límites de Transferencia:\nTu límite diario seguro es de 5.000,00€.'); }} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', cursor: 'pointer', color: 'var(--theme-text-main)', fontSize: '0.9rem', fontWeight: 600 }}>
                <i className="fas fa-lock" style={{ width: '16px', color: 'var(--theme-accent)' }}></i>
                <span>Límites y Seguridad</span>
              </div>
              <div className="menu-item" onClick={() => { setActiveBankMenu(false); setBankAlert('⚙️ Ajustes de Cuenta:\nConfiguraciones de privacidad y alertas push activas.'); }} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', cursor: 'pointer', color: 'var(--theme-text-main)', fontSize: '0.9rem', fontWeight: 600 }}>
                <i className="fas fa-cog" style={{ width: '16px', color: 'var(--theme-accent)' }}></i>
                <span>Ajustes de Cuenta</span>
              </div>
              <div className="menu-item" onClick={() => { setActiveBankMenu(false); setBankAlert('📊 Extracto de Cuenta:\nGenerando extracto en PDF del mes en curso...'); }} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', cursor: 'pointer', color: 'var(--theme-text-main)', fontSize: '0.9rem', fontWeight: 600 }}>
                <i className="fas fa-file-invoice-dollar" style={{ width: '16px', color: 'var(--theme-accent)' }}></i>
                <span>Extracto de Cuenta</span>
              </div>
              <div className="menu-item" onClick={() => { setActiveBankMenu(false); setBankAlert('💬 Soporte en Línea:\nChatea en tiempo real con un agente bancario (Lunes a Viernes 8-20h).'); }} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', cursor: 'pointer', color: 'var(--theme-text-main)', fontSize: '0.9rem', fontWeight: 600 }}>
                <i className="fas fa-comment-dots" style={{ width: '16px', color: 'var(--theme-accent)' }}></i>
                <span>Soporte en Línea</span>
              </div>
              <div className="menu-divider" style={{ height: '1px', backgroundColor: 'var(--theme-border)', margin: '0.4rem 0' }}></div>
              <div className="menu-item logout" onClick={handleLogoutClick} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', cursor: 'pointer', color: '#EF4444', fontSize: '0.9rem', fontWeight: 800 }}>
                <i className="fas fa-right-from-bracket" style={{ width: '16px' }}></i>
                <span>Cerrar Sesión</span>
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Container */}
        <div className="bank-scroll-container" style={{ flex: 1, overflowY: 'auto', padding: '1rem', paddingBottom: '80px', backgroundColor: 'var(--theme-primary-bg)', color: 'var(--theme-text-main)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {bankingTab === 'INICIO' && (
            <div className="bank-tab-content bank-home-view" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
              {/* Account Balance Card */}
              <div className="bank-balance-card" style={{ background: 'linear-gradient(135deg, var(--theme-accent) 0%, var(--theme-accent-hover, #0369A1) 100%)', color: '#FFFFFF', borderRadius: '18px', padding: '1.25rem', boxShadow: '0 8px 20px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative', overflow: 'hidden' }}>
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', fontWeight: 800, opacity: 0.9, letterSpacing: '0.5px' }}>
                  <span>CUENTA DE AHORROS PRINCIPAL</span>
                  <button className="eye-btn" onClick={handleToggleBalance} aria-label="Mostrar u ocultar saldo" style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#FFFFFF', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <i className={`fas ${balanceVisible ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
                <h2 className="card-balance" style={{ fontSize: '2rem', fontWeight: 900, margin: '0.2rem 0', fontFamily: 'Bree Serif, Roboto, sans-serif' }}>
                  {balanceVisible ? '2.450,00€' : '••••••'}
                </h2>
                <div className="card-footer" style={{ fontSize: '0.75rem', opacity: 0.8, letterSpacing: '0.3px', marginTop: '0.2rem' }}>
                  <span>IBAN: ES91 3000 1234 5678 9012</span>
                </div>
              </div>

              {/* Quick Actions Row */}
              <div className="bank-quick-actions" style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-around', gap: '0.5rem', width: '100%', padding: '0.25rem 0' }}>
                <button className="action-btn-circle" onClick={handleQuickTransfer} style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', color: 'var(--theme-text-main)', cursor: 'pointer', fontFamily: 'inherit' }}>
                  <div className="icon-wrapper" style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--theme-icon-bg, #E4E6EB)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--theme-accent)', fontSize: '1.2rem', transition: 'all 0.2s ease', boxShadow: '0 4px 8px rgba(0,0,0,0.05)' }}><i className="fas fa-money-bill-transfer"></i></div>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800 }}>Transferir</span>
                </button>
                <button className="action-btn-circle" onClick={() => handleDistractorClick('Cargar Saldo')} style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', color: 'var(--theme-text-main)', cursor: 'pointer', fontFamily: 'inherit' }}>
                  <div className="icon-wrapper" style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--theme-icon-bg, #E4E6EB)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--theme-accent)', fontSize: '1.2rem', transition: 'all 0.2s ease', boxShadow: '0 4px 8px rgba(0,0,0,0.05)' }}><i className="fas fa-circle-down"></i></div>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800 }}>Recargar</span>
                </button>
                <button className="action-btn-circle" onClick={() => handleTabChange('CARDS')} style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', color: 'var(--theme-text-main)', cursor: 'pointer', fontFamily: 'inherit' }}>
                  <div className="icon-wrapper" style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--theme-icon-bg, #E4E6EB)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--theme-accent)', fontSize: '1.2rem', transition: 'all 0.2s ease', boxShadow: '0 4px 8px rgba(0,0,0,0.05)' }}><i className="fas fa-credit-card"></i></div>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800 }}>Tarjetas</span>
                </button>
              </div>

              {/* Distractor Ads / Promo Banners */}
              <div className="bank-promo-section" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
                <div className="promo-banner success" onClick={() => handleDistractorClick('¡Crédito de 10,000€ YA!')} style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.85rem 1rem', backgroundColor: 'var(--theme-surface-bg)', border: '1.5px solid var(--theme-border)', borderRadius: '14px', cursor: 'pointer', position: 'relative', transition: 'transform 0.2s ease, box-shadow 0.2s ease', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
                  <div className="promo-icon" style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16A34A', fontSize: '1.1rem' }}><i className="fas fa-gift"></i></div>
                  <div className="promo-text" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                    <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: '#15803D' }}>¡Crédito de 10,000€ YA!</h4>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--theme-text-muted)', fontWeight: 600 }}>Pre-aprobado sin comisiones. Pulsa aquí.</p>
                  </div>
                  <i className="fas fa-chevron-right arrow" style={{ color: 'var(--theme-text-muted)', fontSize: '0.8rem' }}></i>
                </div>
                
                <div className="promo-banner danger" onClick={() => handleDistractorClick('¡SORTEO! Gana un smartphone')} style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.85rem 1rem', backgroundColor: 'var(--theme-surface-bg)', border: '1.5px solid var(--theme-border)', borderRadius: '14px', cursor: 'pointer', position: 'relative', transition: 'transform 0.2s ease, box-shadow 0.2s ease', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
                  <div className="promo-icon" style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626', fontSize: '1.1rem' }}><i className="fas fa-trophy"></i></div>
                  <div className="promo-text" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                    <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: '#B91C1C' }}>¡SORTEO DE SMARTPHONE!</h4>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--theme-text-muted)', fontWeight: 600 }}>Gana un dispositivo hoy de forma gratuita.</p>
                  </div>
                  <i className="fas fa-chevron-right arrow" style={{ color: 'var(--theme-text-muted)', fontSize: '0.8rem' }}></i>
                </div>
              </div>

              {/* Recent Transactions list */}
              <div className="bank-section-header" style={{ borderBottom: '1px solid var(--theme-border)', paddingBottom: '0.4rem', marginTop: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 900, color: 'var(--theme-accent)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Transacciones Recientes</h3>
              </div>
              <div className="bank-transactions-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', backgroundColor: 'var(--theme-surface-bg)', border: '1.5px solid var(--theme-border)', borderRadius: '16px', overflow: 'hidden' }}>
                {completedTransfers.map((item, idx) => (
                  <div key={`completed-${idx}`} className="transaction-item highlight" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.85rem 1rem', borderBottom: '1px solid var(--theme-border)', backgroundColor: 'rgba(22, 163, 74, 0.05)' }}>
                    <div className="tx-icon-wrapper success" style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16A34A', fontSize: '1rem' }}><i className="fas fa-check-double"></i></div>
                    <div className="tx-details" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                      <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800 }}>Transf. Enviada (Exitosa)</h4>
                      <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--theme-text-muted)' }}>{item.target} • {item.date}</p>
                    </div>
                    <span className="tx-amount negative" style={{ fontSize: '0.92rem', fontWeight: 900, color: '#DC2626' }}>-{item.amount}</span>
                  </div>
                ))}
                
                <div className="transaction-item" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.85rem 1rem', borderBottom: '1px solid var(--theme-border)' }}>
                  <div className="tx-icon-wrapper" style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--theme-icon-bg, #E4E6EB)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--theme-text-main)', fontSize: '1rem' }}><i className="fas fa-cart-shopping"></i></div>
                  <div className="tx-details" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                    <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800 }}>Supermercado Mercadona</h4>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--theme-text-muted)' }}>Alimentación • 24/05/2026</p>
                  </div>
                  <span className="tx-amount negative" style={{ fontSize: '0.92rem', fontWeight: 900, color: '#DC2626' }}>-42,15€</span>
                </div>
                
                <div className="transaction-item" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.85rem 1rem', borderBottom: '1px solid var(--theme-border)' }}>
                  <div className="tx-icon-wrapper" style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--theme-icon-bg, #E4E6EB)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--theme-text-main)', fontSize: '1rem' }}><i className="fas fa-tv"></i></div>
                  <div className="tx-details" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                    <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800 }}>Suscripción Netflix</h4>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--theme-text-muted)' }}>Entretenimiento • 22/05/2026</p>
                  </div>
                  <span className="tx-amount negative" style={{ fontSize: '0.92rem', fontWeight: 900, color: '#DC2626' }}>-12,99€</span>
                </div>
                
                <div className="transaction-item" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.85rem 1rem' }}>
                  <div className="tx-icon-wrapper income" style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16A34A', fontSize: '1rem' }}><i className="fas fa-hand-holding-dollar"></i></div>
                  <div className="tx-details" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                    <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800 }}>Nómina Mensual Búmer</h4>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--theme-text-muted)' }}>Depósito directo • 20/05/2026</p>
                  </div>
                  <span className="tx-amount positive" style={{ fontSize: '0.92rem', fontWeight: 900, color: '#16A34A' }}>+1.850,00€</span>
                </div>
              </div>
            </div>
          )}

          {bankingTab === 'CARDS' && (
            <div className="bank-tab-content bank-cards-view" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
              <div className="bank-section-header" style={{ borderBottom: '1px solid var(--theme-border)', paddingBottom: '0.4rem' }}>
                <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 900, color: 'var(--theme-accent)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tus Tarjetas Activas</h3>
              </div>
              
              {/* Premium Holographic Credit Card */}
              <div className="visual-credit-card" style={{ background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)', color: '#FFFFFF', borderRadius: '20px', padding: '1.5rem', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative', overflow: 'hidden', border: '1.5px solid rgba(255,255,255,0.08)' }}>
                <div className="card-glow" style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: 'radial-gradient(circle, rgba(251,191,36,0.08) 0%, rgba(255,255,255,0) 70%)', transform: 'rotate(30deg)', pointerEvents: 'none' }}></div>
                <div className="card-top-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <i className="fas fa-wifi chip-wifi" style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.6)', transform: 'rotate(90deg)' }}></i>
                  <span className="card-type" style={{ fontSize: '0.88rem', fontWeight: 900, color: '#FBBF24', letterSpacing: '1px' }}>VISA GOLD</span>
                </div>
                <div className="card-chip" style={{ width: '40px', height: '30px', backgroundColor: '#F59E0B', borderRadius: '6px', position: 'relative', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)' }}></div>
                <h3 className="card-number-display" style={{ margin: '0.4rem 0', fontSize: '1.3rem', fontWeight: 800, letterSpacing: '2.5px', fontFamily: 'monospace' }}>4000 1234 5678 9010</h3>
                <div className="card-holder-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem' }}>
                  <div className="holder-col" style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                    <span className="card-label" style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.5)', fontWeight: 800 }}>TITULAR</span>
                    <span className="card-value" style={{ fontSize: '0.82rem', fontWeight: 800, letterSpacing: '0.5px' }}>USUARIO BÚMER</span>
                  </div>
                  <div className="val-col" style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', textAlign: 'right' }}>
                    <span className="card-label" style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.5)', fontWeight: 800 }}>VALIDEZ</span>
                    <span className="card-value" style={{ fontSize: '0.82rem', fontWeight: 800, letterSpacing: '0.5px' }}>12/30</span>
                  </div>
                </div>
              </div>

              {/* Card Management Controls */}
              <div className="card-controls-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', backgroundColor: 'var(--theme-surface-bg)', border: '1.5px solid var(--theme-border)', borderRadius: '16px', overflow: 'hidden' }}>
                <div className="control-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid var(--theme-border)' }}>
                  <div className="control-left" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', color: 'var(--theme-text-main)' }}>
                    <i className="fas fa-power-off" style={{ color: '#EF4444', fontSize: '1.1rem', width: '18px' }}></i>
                    <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>Bloqueo temporal de tarjeta</span>
                  </div>
                  <label className="switch-toggle" style={{ position: 'relative', display: 'inline-block', width: '46px', height: '24px' }}>
                    <input 
                      type="checkbox" 
                      checked={cardLocked}
                      onChange={handleToggleCardLock}
                      style={{ opacity: 0, width: 0, height: 0 }} 
                    />
                    <span className="slider-round" style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: cardLocked ? 'var(--theme-accent)' : '#CBD5E1', borderRadius: '34px', transition: '0.3s' }}></span>
                  </label>
                </div>
                
                <div className="control-item link" onClick={() => setBankAlert('🔑 Consulta de PIN:\nTu código PIN es 8295. Nunca lo compartas con extraños ni lo anotes en lugares públicos.')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid var(--theme-border)', cursor: 'pointer' }}>
                  <div className="control-left" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', color: 'var(--theme-text-main)' }}>
                    <i className="fas fa-key" style={{ color: 'var(--theme-accent)', fontSize: '1.1rem', width: '18px' }}></i>
                    <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>Consultar PIN de seguridad</span>
                  </div>
                  <i className="fas fa-chevron-right" style={{ color: 'var(--theme-text-muted)', fontSize: '0.8rem' }}></i>
                </div>
                
                <div className="control-item link" onClick={() => setBankAlert('🌐 Compras Online:\nTu tarjeta está autorizada para compras internacionales seguras en línea.')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', cursor: 'pointer' }}>
                  <div className="control-left" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', color: 'var(--theme-text-main)' }}>
                    <i className="fas fa-globe" style={{ color: 'var(--theme-accent)', fontSize: '1.1rem', width: '18px' }}></i>
                    <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>Configurar compras en el extranjero</span>
                  </div>
                  <i className="fas fa-chevron-right" style={{ color: 'var(--theme-text-muted)', fontSize: '0.8rem' }}></i>
                </div>
              </div>
            </div>
          )}

          {bankingTab === 'TRANSFERS' && (
            <div className="bank-tab-content bank-transfers-view" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
              <div className="bank-section-header" style={{ borderBottom: '1px solid var(--theme-border)', paddingBottom: '0.4rem' }}>
                <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 900, color: 'var(--theme-accent)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Realizar Nueva Transferencia</h3>
              </div>

              {/* Form Input fields */}
              <div className="banking-form-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem', width: '100%' }}>
                {transferError && (
                  <div className="form-error-banner" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1rem', backgroundColor: '#FEE2E2', border: '1.5px solid #FCA5A5', borderRadius: '14px', color: '#991B1B', fontSize: '0.85rem', fontWeight: 800, lineHeight: 1.4 }}>
                    <i className="fas fa-triangle-exclamation" style={{ fontSize: '1.1rem' }}></i>
                    <span>{transferError}</span>
                  </div>
                )}

                <div className="bank-field-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  <label htmlFor="tx-target-alias" style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>CBU, Alias o Cuenta Destinataria</label>
                  <div className="input-with-icon" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <i className="fas fa-user-tag field-icon" style={{ position: 'absolute', left: '14px', color: 'var(--theme-accent)', fontSize: '1.05rem' }}></i>
                    <input 
                      id="tx-target-alias"
                      type="text" 
                      placeholder="ej. juan.perez.banco"
                      value={transferTarget}
                      onChange={(e) => {
                        setTransferTarget(e.target.value);
                        setTransferError(null);
                      }}
                      style={{ width: '100%', padding: '0.85rem 1rem', paddingLeft: '2.6rem', border: '1.5px solid var(--theme-border)', borderRadius: '14px', backgroundColor: 'var(--theme-surface-bg)', color: 'var(--theme-text-main)', fontSize: '0.95rem', fontWeight: 700, fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.2s ease' }}
                    />
                  </div>
                </div>

                <div className="bank-field-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  <label htmlFor="tx-amount-val" style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Monto a Transferir (€)</label>
                  <div className="input-with-icon" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <i className="fas fa-euro-sign field-icon" style={{ position: 'absolute', left: '14px', color: 'var(--theme-accent)', fontSize: '1.05rem' }}></i>
                    <input 
                      id="tx-amount-val"
                      type="text" 
                      placeholder="0.00"
                      value={transferAmount}
                      onChange={(e) => {
                        setTransferAmount(e.target.value);
                        setTransferError(null);
                      }}
                      style={{ width: '100%', padding: '0.85rem 1rem', paddingLeft: '2.6rem', border: '1.5px solid var(--theme-border)', borderRadius: '14px', backgroundColor: 'var(--theme-surface-bg)', color: 'var(--theme-text-main)', fontSize: '0.95rem', fontWeight: 700, fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.2s ease' }}
                    />
                  </div>
                </div>

                {/* Quick Frequent Contacts */}
                <div className="bank-field-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Destinatarios Frecuentes (Toca para auto-completar)</label>
                  <div className="frequent-contacts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.65rem', width: '100%' }}>
                    <button 
                      className="contact-pill" 
                      onClick={() => handleQuickContactSelect('Juan Pérez', 'juan.perez.banco')}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.75rem 0.85rem', backgroundColor: 'var(--theme-surface-bg)', border: '1.5px solid var(--theme-border)', borderRadius: '12px', color: 'var(--theme-text-main)', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s ease', textAlign: 'left' }}
                    >
                      <i className="fas fa-user-circle" style={{ color: 'var(--theme-accent)', fontSize: '1.1rem' }}></i>
                      <span>Juan Pérez ({parseInt(targetAmount, 10)}€)</span>
                    </button>
                    <button 
                      className="contact-pill" 
                      onClick={() => handleQuickContactSelect('María López', 'maria.lopez.banco')}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.75rem 0.85rem', backgroundColor: 'var(--theme-surface-bg)', border: '1.5px solid var(--theme-border)', borderRadius: '12px', color: 'var(--theme-text-main)', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s ease', textAlign: 'left' }}
                    >
                      <i className="fas fa-user-circle" style={{ color: 'var(--theme-accent)', fontSize: '1.1rem' }}></i>
                      <span>María López</span>
                    </button>
                  </div>
                </div>

                {/* Target Action Button */}
                <button 
                  className={`bank-submit-btn ${targetComp ? 'is-target' : ''}`}
                  onClick={handleConfirmTransferSubmit}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '1rem', backgroundColor: 'var(--theme-accent)', border: 'none', borderRadius: '14px', color: '#FFFFFF', fontSize: '1rem', fontWeight: 900, cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 6px 16px rgba(0,0,0,0.1)', fontFamily: 'Bree Serif, Roboto, sans-serif' }}
                >
                  <i className="fas fa-shield-halved" style={{ fontSize: '1.15rem' }}></i>
                  <span>Confirmar Transferencia Seguro</span>
                </button>
              </div>
            </div>
          )}

          {bankingTab === 'BIZUM' && (
            <div className="bank-tab-content bank-bizum-view" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
              <div className="bank-section-header" style={{ borderBottom: '1px solid var(--theme-border)', paddingBottom: '0.4rem' }}>
                <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 900, color: 'var(--theme-accent)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Hacer un Bizum</h3>
              </div>

              {/* Hero icon */}
              <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
                <div className="bizum-hero-icon">
                  <i className="fas fa-mobile-screen-button"></i>
                </div>
                <p style={{ margin: '0.5rem 0 0', fontSize: '0.82rem', color: 'var(--theme-text-muted)', fontWeight: 600 }}>
                  Envía dinero de forma instantánea y segura
                </p>
              </div>

              {/* Error banner */}
              {bizumError && (
                <div className="bizum-error-banner">
                  <i className="fas fa-triangle-exclamation" style={{ fontSize: '1.1rem' }}></i>
                  <span>{bizumError}</span>
                </div>
              )}

              {/* Form fields */}
              <div className="bizum-form-field">
                <label htmlFor="bizum-target">Usuario (Teléfono o Contacto)</label>
                <div className="bizum-input-wrapper">
                  <i className="fas fa-user-tag bizum-field-icon"></i>
                  <input
                    id="bizum-target"
                    type="text"
                    placeholder="ej. 612345678 o María García"
                    value={bizumTarget}
                    onChange={(e) => { setBizumTarget(e.target.value); setBizumError(null); }}
                  />
                </div>
              </div>

              <div className="bizum-form-field">
                <label htmlFor="bizum-concept">Concepto</label>
                <div className="bizum-input-wrapper">
                  <i className="fas fa-comment-dots bizum-field-icon"></i>
                  <input
                    id="bizum-concept"
                    type="text"
                    placeholder="ej. Cena del sábado"
                    value={bizumConcept}
                    onChange={(e) => { setBizumConcept(e.target.value); setBizumError(null); }}
                  />
                </div>
              </div>

              <div className="bizum-form-field">
                <label htmlFor="bizum-amount">Importe (€)</label>
                <div className="bizum-input-wrapper">
                  <i className="fas fa-euro-sign bizum-field-icon"></i>
                  <input
                    id="bizum-amount"
                    type="text"
                    placeholder="0.00"
                    value={bizumAmount}
                    onChange={(e) => { setBizumAmount(e.target.value); setBizumError(null); }}
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="bizum-actions-row">
                <button className="bizum-cancel-btn" onClick={handleBizumCancel}>
                  <i className="fas fa-xmark"></i> Cancelar
                </button>
                <button className="bizum-submit-btn" onClick={handleBizumSubmit}>
                  <i className="fas fa-paper-plane"></i>
                  <span>Enviar Bizum</span>
                </button>
              </div>
            </div>
          )}

          {bankingTab === 'HISTORY' && (
            <div className="bank-tab-content bank-history-view" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
              <div className="bank-section-header" style={{ borderBottom: '1px solid var(--theme-border)', paddingBottom: '0.4rem' }}>
                <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 900, color: 'var(--theme-accent)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Historial de Movimientos</h3>
              </div>
              <div className="bank-history-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
                {/* Completed transfers from this session (shown first) */}
                {completedTransfers.map((item, idx) => (
                  <div key={`history-completed-${idx}`} className="history-card" style={{ backgroundColor: 'var(--theme-surface-bg)', border: '1.5px solid var(--theme-border)', borderRadius: '16px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.85rem', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16A34A', fontSize: '1rem', flexShrink: 0 }}>
                      <i className="fas fa-check-double"></i>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.15rem', minWidth: 0 }}>
                      <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Transf. Enviada (Exitosa)</h4>
                      <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--theme-text-muted)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.target} • {item.date}</p>
                    </div>
                    <span style={{ fontSize: '0.92rem', fontWeight: 900, color: '#DC2626', flexShrink: 0 }}>-{item.amount}</span>
                  </div>
                ))}

                {/* Full 20-item static transaction history */}
                {STATIC_TRANSACTIONS.map((tx, idx) => (
                  <div key={`history-static-${idx}`} className="history-card" style={{ backgroundColor: 'var(--theme-surface-bg)', border: '1.5px solid var(--theme-border)', borderRadius: '16px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.85rem', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: tx.positive ? '#DCFCE7' : 'var(--theme-icon-bg, #E4E6EB)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: tx.positive ? '#16A34A' : 'var(--theme-text-main)', fontSize: '1rem', flexShrink: 0 }}>
                      <i className={`fas fa-${tx.icon}`}></i>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.15rem', minWidth: 0 }}>
                      <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.label}</h4>
                      <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--theme-text-muted)', fontWeight: 600 }}>{tx.category} • {tx.date}</p>
                    </div>
                    <span style={{ fontSize: '0.92rem', fontWeight: 900, color: tx.positive ? '#16A34A' : '#DC2626', flexShrink: 0 }}>
                      {tx.positive ? '+' : '-'}{tx.amount}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Tab Bar Navigation */}
        <div className="banking-bottom-nav" style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '64px', backgroundColor: 'var(--theme-surface-bg)', borderTop: '1.5px solid var(--theme-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-around', zIndex: 99 }}>
          <button 
            className={`nav-btn ${bankingTab === 'INICIO' ? 'active' : ''}`}
            onClick={() => handleTabChange('INICIO')}
            style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyItems: 'center', gap: '0.25rem', color: bankingTab === 'INICIO' ? 'var(--theme-accent)' : 'var(--theme-text-muted)', cursor: 'pointer', width: '25%', height: '100%', justifyContent: 'center', fontFamily: 'inherit' }}
          >
            <i className="fas fa-house" style={{ fontSize: '1.15rem' }}></i>
            <span style={{ fontSize: '0.7rem', fontWeight: 800 }}>Inicio</span>
          </button>
          <button 
            className={`nav-btn ${bankingTab === 'CARDS' ? 'active' : ''}`}
            onClick={() => handleTabChange('CARDS')}
            style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyItems: 'center', gap: '0.25rem', color: bankingTab === 'CARDS' ? 'var(--theme-accent)' : 'var(--theme-text-muted)', cursor: 'pointer', width: '25%', height: '100%', justifyContent: 'center', fontFamily: 'inherit' }}
          >
            <i className="fas fa-credit-card" style={{ fontSize: '1.15rem' }}></i>
            <span style={{ fontSize: '0.7rem', fontWeight: 800 }}>Tarjetas</span>
          </button>
          <button 
            className={`nav-btn ${bankingTab === 'TRANSFERS' ? 'active' : ''}`}
            onClick={() => handleTabChange('TRANSFERS')}
            style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyItems: 'center', gap: '0.25rem', color: bankingTab === 'TRANSFERS' ? 'var(--theme-accent)' : 'var(--theme-text-muted)', cursor: 'pointer', width: '25%', height: '100%', justifyContent: 'center', fontFamily: 'inherit' }}
          >
            <i className="fas fa-money-bill-transfer" style={{ fontSize: '1.15rem' }}></i>
            <span style={{ fontSize: '0.7rem', fontWeight: 800 }}>Transferir</span>
          </button>
          <button 
            className={`nav-btn ${bankingTab === 'HISTORY' ? 'active' : ''}`}
            onClick={() => handleTabChange('HISTORY')}
            style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyItems: 'center', gap: '0.25rem', color: bankingTab === 'HISTORY' ? 'var(--theme-accent)' : 'var(--theme-text-muted)', cursor: 'pointer', width: '25%', height: '100%', justifyContent: 'center', fontFamily: 'inherit' }}
          >
            <i className="fas fa-clock-rotate-left" style={{ fontSize: '1.15rem' }}></i>
            <span style={{ fontSize: '0.7rem', fontWeight: 800 }}>Historial</span>
          </button>
        </div>

        {/* Modal Overlay Bank Alerts */}
        {bankAlert && (
          <div className="bank-dialog-overlay" onClick={() => setBankAlert(null)} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, backdropFilter: 'blur(3px)' }}>
            <div className="bank-dialog-modal" onClick={(e) => e.stopPropagation()} style={{ width: '85%', backgroundColor: 'var(--theme-surface-bg)', borderRadius: '18px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1.5px solid var(--theme-border)', boxShadow: '0 20px 40px rgba(0,0,0,0.25)', animation: 'scaleUp 0.25s ease both' }}>
              <div className="modal-header" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', borderBottom: '1px solid var(--theme-border)', paddingBottom: '0.5rem' }}>
                <i className="fas fa-shield-halved security-icon" style={{ color: 'var(--theme-accent)', fontSize: '1.3rem' }}></i>
                <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 900, color: 'var(--theme-accent)', textTransform: 'uppercase' }}>{bankName.toUpperCase()} SEGURIDAD</h3>
              </div>
              <div className="modal-body">
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--theme-text-main)', fontWeight: 700, lineHeight: 1.5, whiteSpace: 'pre-line' }}>{bankAlert}</p>
              </div>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.2rem' }}>
                <button onClick={() => {
                  if (cardLocked && screen?.missionText.includes('Bloquea temporalmente')) {
                    setSuccess(true);
                  }
                  if (bankAlert?.includes('Consulta de PIN') && screen?.missionText.includes('Consultar el PIN')) {
                    setSuccess(true);
                  }
                  setBankAlert(null);
                }} style={{ padding: '0.65rem 1.5rem', backgroundColor: 'var(--theme-accent)', border: 'none', borderRadius: '10px', color: '#FFFFFF', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', fontFamily: 'Bree Serif, Roboto, sans-serif' }}>Entendido</button>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  };

  const renderClockApp = () => {
    if (!screen) return null;

    // Detect theme version passed via HEADER_MISSION component
    const headerComp = screen.components.find(c => c.type === 'HEADER_MISSION');
    const version = headerComp?.props?.version || 1; // 1: Glass, 2: Neomorph, 3: Zen
    const themeClass = `clock-theme-${version}`;

    // Objective checks
    const checkAlarmObjective = () => {
      if (screen.missionText.toLowerCase().includes('activa la alarma')) {
        setSuccess(true);
      }
    };
    const checkWorldObjective = () => {
      if (screen.missionText.toLowerCase().includes('zona horaria')) {
        setSuccess(true);
      }
    };
    const checkTimerObjective = () => {
      if (screen.missionText.includes('Inicia el temporizador')) {
        setSuccess(true);
      }
    };
    const checkStopwatchObjective = () => {
      if (screen.missionText.includes('Cronometra 5 segundos') && stopwatchTime >= 5000) {
        setSuccess(true);
      }
    };

    const formatTimer = (sec: number) => {
      const m = Math.floor(sec / 60).toString().padStart(2, '0');
      const s = (sec % 60).toString().padStart(2, '0');
      return `${m}:${s}`;
    };

    const formatStopwatch = (ms: number) => {
      const m = Math.floor(ms / 60000).toString().padStart(2, '0');
      const s = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0');
      const msPart = Math.floor((ms % 1000) / 10).toString().padStart(2, '0');
      return `${m}:${s}.${msPart}`;
    };

    const presetAlarms = [
      { time: '07:00', label: 'Despertador', meridiem: 'AM', isTarget: true },
      { time: '09:30', label: 'Pastilla', meridiem: 'AM', isTarget: false },
      { time: '02:00', label: 'Comida', meridiem: 'PM', isTarget: false },
      { time: '06:00', label: 'Gimnasio', meridiem: 'PM', isTarget: false }
    ];

    return (
      <div className={`clock-app-container ${themeClass}`}>
        <div className="clock-content-area">
          {clockTab === 'ALARM' && (
            <div className="clock-view-alarm">
              <h2 className="clock-view-title">Alarmas</h2>
              <div className="alarm-list">
                {presetAlarms.map((alarm, idx) => (
                  <div className="alarm-card" key={idx}>
                    <div className="alarm-info">
                      <div className="alarm-time">{alarm.time} <span className="alarm-meridiem">{alarm.meridiem}</span></div>
                      <div className="alarm-label">{alarm.label}</div>
                    </div>
                    <label className="clock-switch">
                      <input 
                        type="checkbox" 
                        checked={alarm.isTarget ? alarmActive : (dummyAlarmsActive[idx] || false)} 
                        onChange={(e) => {
                          if (alarm.isTarget) {
                            setAlarmActive(e.target.checked);
                            if (e.target.checked) checkAlarmObjective();
                          } else {
                            setDummyAlarmsActive(prev => ({
                              ...prev,
                              [idx]: e.target.checked
                            }));
                          }
                        }} 
                      />
                      <span className="clock-slider"></span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {clockTab === 'WORLD' && (
            <div className="clock-view-world">
              <h2 className="clock-view-title">Reloj Mundial</h2>
              <div className="world-list">
                {worldCities.map((city, idx) => (
                  <div key={idx} className="world-city-card">
                    <div className="world-city-name">{city.name}</div>
                    <div className="world-city-time">{currentTime}</div>
                  </div>
                ))}
              </div>
              <button className="clock-fab-btn" onClick={() => setShowAddCityModal(true)}>
                <i className="fas fa-plus"></i>
              </button>

              {showAddCityModal && (
                <div className="city-modal-overlay">
                  <div className="city-modal-content">
                    <h3>Añadir Ciudad</h3>
                    <input 
                      type="text" 
                      placeholder="Ej: Tokio, Londres..."
                      value={newCityName}
                      onChange={(e) => setNewCityName(e.target.value)}
                      autoFocus
                    />
                    <div className="city-modal-actions">
                      <button className="btn-cancel" onClick={() => {
                        setShowAddCityModal(false);
                        setNewCityName('');
                      }}>Cancelar</button>
                      <button className="btn-add" onClick={() => {
                        if (newCityName.trim()) {
                          const city = newCityName.trim();
                          let offset = 0;
                          if (city.toLowerCase().includes('tokio') || city.toLowerCase().includes('tokyo')) offset = 9;
                          else if (city.toLowerCase().includes('londres') || city.toLowerCase().includes('london')) offset = 1;
                          else if (city.toLowerCase().includes('nueva york') || city.toLowerCase().includes('new york')) offset = -5;
                          else if (city.toLowerCase().includes('sídney') || city.toLowerCase().includes('sydney')) offset = 11;
                          else offset = Math.floor(Math.random() * 24) - 12;

                          setWorldCities([...worldCities, {name: city, timeOffset: offset}]);
                          
                          if (city.toLowerCase().includes('tokio') || city.toLowerCase().includes('tokyo')) {
                            checkWorldObjective();
                          }
                          setShowAddCityModal(false);
                          setNewCityName('');
                        }
                      }}>Añadir</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {clockTab === 'TIMER' && (
            <div className="clock-view-timer">
              <h2 className="clock-view-title">Temporizador</h2>
              <div className="clock-big-display">
                {formatTimer(timerTime)}
              </div>
              <div className="clock-controls">
                <button className="clock-btn clock-btn-secondary" onClick={() => {
                  setTimerRunning(false);
                  setTimerTime(300);
                }}>Cancelar</button>
                <button className="clock-btn clock-btn-primary" onClick={() => {
                  setTimerRunning(!timerRunning);
                  if (!timerRunning) checkTimerObjective();
                }}>
                  {timerRunning ? 'Pausar' : 'Iniciar'}
                </button>
              </div>
            </div>
          )}

          {clockTab === 'STOPWATCH' && (
            <div className="clock-view-stopwatch">
              <h2 className="clock-view-title">Cronómetro</h2>
              <div className="clock-big-display">
                {formatStopwatch(stopwatchTime)}
              </div>
              <div className="clock-controls">
                <button className="clock-btn clock-btn-secondary" onClick={() => {
                  setStopwatchRunning(false);
                  setStopwatchTime(0);
                }}>Vuelta</button>
                <button className="clock-btn clock-btn-primary" onClick={() => {
                  if (stopwatchRunning) {
                    setStopwatchRunning(false);
                    checkStopwatchObjective();
                  } else {
                    setStopwatchRunning(true);
                  }
                }}>
                  {stopwatchRunning ? 'Detener' : 'Iniciar'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="clock-tab-bar">
          <button className={`clock-tab-btn ${clockTab === 'ALARM' ? 'active' : ''}`} onClick={() => setClockTab('ALARM')}>
            <i className={themeClass === 'clock-theme-2' ? 'far fa-bell' : themeClass === 'clock-theme-3' ? 'fas fa-clock-rotate-left' : 'fas fa-bell'}></i>
            <span>Alarmas</span>
          </button>
          <button className={`clock-tab-btn ${clockTab === 'WORLD' ? 'active' : ''}`} onClick={() => setClockTab('WORLD')}>
            <i className={themeClass === 'clock-theme-2' ? 'far fa-compass' : themeClass === 'clock-theme-3' ? 'fas fa-earth-americas' : 'fas fa-globe'}></i>
            <span>Mundial</span>
          </button>
          <button className={`clock-tab-btn ${clockTab === 'TIMER' ? 'active' : ''}`} onClick={() => setClockTab('TIMER')}>
            <i className={themeClass === 'clock-theme-2' ? 'far fa-hourglass' : themeClass === 'clock-theme-3' ? 'fas fa-hourglass-end' : 'fas fa-hourglass-half'}></i>
            <span>Temp.</span>
          </button>
          <button className={`clock-tab-btn ${clockTab === 'STOPWATCH' ? 'active' : ''}`} onClick={() => setClockTab('STOPWATCH')}>
            <i className={themeClass === 'clock-theme-2' ? 'far fa-clock' : themeClass === 'clock-theme-3' ? 'fas fa-stopwatch' : 'fas fa-stopwatch'}></i>
            <span>Crono</span>
          </button>
        </div>
        
      </div>
    );
  };

  const renderFlightApp = () => {
    if (!screen) return null;
    const headerComp = screen.components.find(c => c.type === 'HEADER_MISSION');
    const version = headerComp?.props?.version || 0; // 0: Minimal, 1: Glass, 2: Brutal

    const handleFlightObjectiveCheck = () => {
      const isBookingObj = screen.missionText.includes('Reserva un vuelo');
      const isBaggageObj = screen.missionText.includes('Añade una maleta');
      const isBoardingObj = screen.missionText.includes('Abre tu tarjeta');
      const isTokyoObj = screen.missionText.includes('Tokyo');

      if (isBookingObj && flightBooked) setSuccess(true);
      if (isTokyoObj && flightBooked && flightTripType === 'SOLO_IDA' && flightDest.toLowerCase().includes('tokyo')) setSuccess(true);
      if (isBaggageObj && flightBaggageAdded) setSuccess(true);
      if (isBoardingObj && flightTab === 'BOARDING') setSuccess(true);
    };

    // Helper common triggers
    const triggerSearch = () => {
      if (flightDest.toLowerCase().includes('paris') || flightDest.toLowerCase().includes('parís')) {
        setFlightBooked(true);
        setTimeout(() => handleFlightObjectiveCheck(), 100);
      }
    };
    const addBaggage = () => {
      setFlightBaggageAdded(true); 
      setShowFlightBaggageModal(false); 
      setShowExtraOptions(false);
      setTimeout(() => handleFlightObjectiveCheck(), 100);
    };

    // Minimal Theme: Bottom Navigation
    if (version === 0) {
      return (
        <div className="flight-app minimal-theme" style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '100%', overflow: 'hidden', background: 'var(--theme-primary-bg)' }}>
          <div style={{ padding: '1.5rem', flex: 1, overflowY: 'auto', paddingBottom: '90px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--theme-text-main)', marginBottom: '1.5rem' }}>Búmer Airlines</h2>
            {flightTab === 'SEARCH' && flightSearchStep === 'FORM' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', background: 'var(--theme-surface-bg)', borderRadius: '12px', padding: '0.25rem' }}>
                  <button onClick={() => setFlightTripType('IDA_VUELTA')} style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', background: flightTripType === 'IDA_VUELTA' ? 'var(--theme-primary-bg)' : 'transparent', color: flightTripType === 'IDA_VUELTA' ? 'var(--theme-text-main)' : '#9CA3AF', border: 'none', fontWeight: 600, transition: 'all 0.2s', boxShadow: flightTripType === 'IDA_VUELTA' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', cursor: 'pointer' }}>Ida y vuelta</button>
                  <button onClick={() => setFlightTripType('SOLO_IDA')} style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', background: flightTripType === 'SOLO_IDA' ? 'var(--theme-primary-bg)' : 'transparent', color: flightTripType === 'SOLO_IDA' ? 'var(--theme-text-main)' : '#9CA3AF', border: 'none', fontWeight: 600, transition: 'all 0.2s', boxShadow: flightTripType === 'SOLO_IDA' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', cursor: 'pointer' }}>Solo ida</button>
                </div>
                <div style={{ padding: '1rem', background: 'var(--theme-surface-bg)', borderRadius: '12px' }}>
                  <label style={{ fontSize: '0.8rem', color: '#6B7280' }}>Origen</label>
                  <input type="text" value={flightOrigin} readOnly style={{ width: '100%', border: 'none', background: 'transparent', fontSize: '1.1rem', marginTop: '0.2rem', outline: 'none', color: 'var(--theme-text-main)' }} />
                </div>
                <div style={{ padding: '1rem', background: 'var(--theme-surface-bg)', borderRadius: '12px' }}>
                  <label style={{ fontSize: '0.8rem', color: '#6B7280' }}>Destino</label>
                  <input type="text" value={flightDest} onChange={(e) => setFlightDest(e.target.value)} placeholder="¿A dónde viajas?" style={{ width: '100%', border: 'none', background: 'transparent', fontSize: '1.1rem', marginTop: '0.2rem', outline: 'none', color: 'var(--theme-text-main)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ flex: 1, padding: '1rem', background: 'var(--theme-surface-bg)', borderRadius: '12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }} onClick={(e) => { const i = e.currentTarget.querySelector('input'); if(i && i.showPicker) { try { i.showPicker() } catch(err){} } }}>
                    <label style={{ fontSize: '0.8rem', color: '#6B7280', cursor: 'pointer' }}>Fecha Ida</label>
                    <input type="date" value={flightDate} onChange={(e) => setFlightDate(e.target.value)} onClick={(e) => { e.stopPropagation(); try { if ((e.target as any).showPicker) (e.target as any).showPicker(); } catch(err){} }} style={{ width: '100%', minWidth: 0, border: 'none', background: 'transparent', fontSize: '1rem', marginTop: '0.2rem', outline: 'none', color: 'var(--theme-text-main)', cursor: 'pointer', padding: 0 }} />
                  </div>
                  {flightTripType === 'IDA_VUELTA' && (
                    <div style={{ flex: 1, padding: '1rem', background: 'var(--theme-surface-bg)', borderRadius: '12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }} onClick={(e) => { const i = e.currentTarget.querySelector('input'); if(i && i.showPicker) { try { i.showPicker() } catch(err){} } }}>
                      <label style={{ fontSize: '0.8rem', color: '#6B7280', cursor: 'pointer' }}>Fecha Vuelta</label>
                      <input type="date" value={flightReturnDate} onChange={(e) => setFlightReturnDate(e.target.value)} onClick={(e) => { e.stopPropagation(); try { if ((e.target as any).showPicker) (e.target as any).showPicker(); } catch(err){} }} style={{ width: '100%', minWidth: 0, border: 'none', background: 'transparent', fontSize: '1rem', marginTop: '0.2rem', outline: 'none', color: 'var(--theme-text-main)', cursor: 'pointer', padding: 0 }} />
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1, padding: '1rem', background: 'var(--theme-surface-bg)', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
                    <label style={{ fontSize: '0.8rem', color: '#6B7280' }}>Pasajeros</label>
                    <select value={flightPassengers} onChange={e => setFlightPassengers(Number(e.target.value))} style={{ width: '100%', minWidth: 0, border: 'none', background: 'transparent', fontSize: '1rem', marginTop: '0.2rem', color: 'var(--theme-text-main)', padding: 0 }}>
                      {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} Pasajeros</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1, padding: '1rem', background: 'var(--theme-surface-bg)', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
                    <label style={{ fontSize: '0.8rem', color: '#6B7280' }}>Clase</label>
                    <select value={flightClass} onChange={e => setFlightClass(e.target.value as any)} style={{ width: '100%', minWidth: 0, border: 'none', background: 'transparent', fontSize: '1rem', marginTop: '0.2rem', color: 'var(--theme-text-main)', padding: 0 }}>
                      <option value="TURISTA">Turista</option>
                      <option value="BUSINESS">Business</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: flightBaggageAdded ? 'var(--theme-primary-bg)' : 'transparent', border: flightBaggageAdded ? '2px solid var(--theme-accent)' : '1px solid #E5E7EB', borderRadius: '12px', transition: 'all 0.2s' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--theme-text-main)', fontWeight: 600 }}>Equipaje de bodega (20kg)</span>
                    <span style={{ fontSize: '0.8rem', color: flightBaggageAdded ? 'var(--theme-accent)' : '#6B7280' }}>{flightBaggageAdded ? 'Añadido (+35€)' : 'Opcional (+35€)'}</span>
                  </div>
                  <label className="toggle-switch" style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
                    <input type="checkbox" checked={flightBaggageAdded} onChange={(e) => { if (e.target.checked) addBaggage(); else setFlightBaggageAdded(false); }} style={{ opacity: 0, width: 0, height: 0 }} />
                    <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: flightBaggageAdded ? 'var(--theme-accent)' : '#D1D5DB', transition: '.4s', borderRadius: '24px' }}>
                      <span style={{ position: 'absolute', content: '""', height: '18px', width: '18px', left: flightBaggageAdded ? '23px' : '3px', bottom: '3px', backgroundColor: 'white', transition: '.4s', borderRadius: '50%', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}></span>
                    </span>
                  </label>
                </div>

                <button onClick={() => setFlightSearchStep('RESULTS')} style={{ padding: '1rem', background: 'var(--theme-accent)', color: '#FFF', border: 'none', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 600, marginTop: '1rem', cursor: 'pointer' }}>Buscar Vuelos</button>
              </div>
            )}

            {flightTab === 'SEARCH' && flightSearchStep === 'RESULTS' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <button onClick={() => setFlightSearchStep('FORM')} style={{ background: 'none', border: 'none', color: 'var(--theme-accent)', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0', fontSize: '1rem', fontWeight: 600 }}>
                  <i className="fas fa-arrow-left"></i> Volver a buscar
                </button>
                <div style={{ background: 'var(--theme-surface-bg)', padding: '1rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{flightOrigin.split(' ')[0]} <i className="fas fa-plane" style={{ margin: '0 0.5rem', color: '#9CA3AF', fontSize: '1rem' }}></i> {flightDest || 'París'}</div>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#6B7280', marginTop: '0.5rem' }}>
                    {flightDate} {flightTripType === 'IDA_VUELTA' ? ` - ${flightReturnDate}` : ''} • {flightPassengers} Pasajero(s) • {flightClass}
                  </div>
                </div>
                
                <h3 style={{ fontSize: '1.1rem', margin: '1rem 0 0.5rem 0' }}>Vuelos de ida</h3>
                
                {[
                  { id: 1, start: '06:15', end: '09:00', dur: '2h 45m', stops: 'Directo', price: flightClass === 'BUSINESS' ? 320 : 85 },
                  { id: 2, start: '08:30', end: '11:15', dur: '2h 45m', stops: 'Directo', price: flightClass === 'BUSINESS' ? 350 : 120 },
                  { id: 3, start: '10:00', end: '13:30', dur: '3h 30m', stops: '1 Escala', price: flightClass === 'BUSINESS' ? 290 : 75 },
                  { id: 4, start: '14:00', end: '16:45', dur: '2h 45m', stops: 'Directo', price: flightClass === 'BUSINESS' ? 380 : 160 },
                  { id: 5, start: '18:20', end: '21:05', dur: '2h 45m', stops: 'Directo', price: flightClass === 'BUSINESS' ? 340 : 110 },
                  { id: 6, start: '21:45', end: '00:30', dur: '2h 45m', stops: 'Directo', price: flightClass === 'BUSINESS' ? 280 : 65 },
                ].map(f => (
                  <div key={f.id} style={{ background: 'var(--theme-surface-bg)', padding: '1rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{f.start}</div>
                          <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>{flightOrigin.substring(0, 3).toUpperCase()}</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '60px' }}>
                          <span style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>{f.dur}</span>
                          <div style={{ height: '2px', width: '100%', background: '#E5E7EB', position: 'relative', margin: '4px 0' }}><i className="fas fa-plane" style={{ position: 'absolute', right: '-5px', top: '-6px', color: '#9CA3AF', fontSize: '0.8rem' }}></i></div>
                          <span style={{ fontSize: '0.7rem', color: f.stops === 'Directo' ? '#10B981' : '#F59E0B' }}>{f.stops}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{f.end}</div>
                          <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>{(flightDest || 'PAR').substring(0, 3).toUpperCase()}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--theme-text-main)' }}>{f.price + (flightBaggageAdded ? 35 : 0)}€</div>
                    </div>
                    <button onClick={() => setFlightSearchStep('CHECKOUT')} style={{ background: 'var(--theme-accent)', color: '#FFF', border: 'none', padding: '0.75rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Seleccionar</button>
                  </div>
                ))}
              </div>
            )}

            {flightTab === 'SEARCH' && flightSearchStep === 'CHECKOUT' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <button onClick={() => setFlightSearchStep('RESULTS')} style={{ background: 'none', border: 'none', color: 'var(--theme-accent)', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0', fontSize: '1rem', fontWeight: 600 }}>
                  <i className="fas fa-arrow-left"></i> Cambiar vuelo
                </button>
                <div style={{ background: 'var(--theme-surface-bg)', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem' }}>Resumen del pago</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: '#6B7280' }}>Vuelo base</span>
                    <span>120€</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: '#6B7280' }}>Tasas e impuestos</span>
                    <span>15€</span>
                  </div>
                  {flightBaggageAdded && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ color: '#6B7280' }}>Equipaje (20kg)</span>
                      <span>35€</span>
                    </div>
                  )}
                  <div style={{ height: '1px', background: '#E5E7EB', margin: '1rem 0' }}></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.2rem' }}>
                    <span>Total a pagar</span>
                    <span>{135 + (flightBaggageAdded ? 35 : 0)}€</span>
                  </div>
                </div>

                <div style={{ background: 'var(--theme-surface-bg)', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Método de pago</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div onClick={() => setFlightPaymentMethod('CARD')} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', border: flightPaymentMethod === 'CARD' ? '2px solid var(--theme-accent)' : '1px solid #E5E7EB', borderRadius: '8px', background: flightPaymentMethod === 'CARD' ? 'var(--theme-primary-bg)' : 'transparent', cursor: 'pointer' }}>
                      <i className="fas fa-credit-card" style={{ fontSize: '1.5rem', color: flightPaymentMethod === 'CARD' ? 'var(--theme-accent)' : '#9CA3AF' }}></i>
                      <div>
                        <div style={{ fontWeight: 600 }}>Tarjeta de Crédito/Débito</div>
                        <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>Visa, Mastercard, Amex</div>
                      </div>
                    </div>
                    <div onClick={() => setFlightPaymentMethod('PAYPAL')} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', border: flightPaymentMethod === 'PAYPAL' ? '2px solid var(--theme-accent)' : '1px solid #E5E7EB', borderRadius: '8px', background: flightPaymentMethod === 'PAYPAL' ? 'var(--theme-primary-bg)' : 'transparent', cursor: 'pointer' }}>
                      <i className="fab fa-paypal" style={{ fontSize: '1.5rem', color: flightPaymentMethod === 'PAYPAL' ? '#003087' : '#9CA3AF' }}></i>
                      <div>
                        <div style={{ fontWeight: 600 }}>PayPal</div>
                        <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>Paga de forma segura</div>
                      </div>
                    </div>
                  </div>
                </div>

                <button onClick={() => { setFlightBooked(true); setTimeout(() => handleFlightObjectiveCheck(), 100); }} style={{ padding: '1.2rem', background: 'var(--theme-accent)', color: '#FFF', border: 'none', borderRadius: '12px', fontSize: '1.2rem', fontWeight: 700, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                  <i className="fas fa-lock"></i> Pagar de forma segura
                </button>
              </div>
            )}

            {flightTab === 'PROFILE' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ background: 'linear-gradient(135deg, #111827 0%, #374151 100%)', borderRadius: '16px', padding: '1.5rem', color: '#FFF', position: 'relative', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '0.9rem', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '1px' }}>Búmer Silver</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.2rem' }}>Usuario Demo</div>
                    </div>
                    <i className="fas fa-crown" style={{ color: '#FCD34D', fontSize: '2rem', opacity: 0.8 }}></i>
                  </div>
                  <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '2rem', fontWeight: 900, lineHeight: 1 }}>12,450</div>
                      <div style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>Millas disponibles</div>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#D1D5DB' }}>ID: 884-291-B</div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {[
                    { icon: 'fa-id-card', title: 'Información y documentos', desc: 'Pasaporte, visados' },
                    { icon: 'fa-sliders', title: 'Preferencias de viaje', desc: 'Asientos, comida, aeropuerto' },
                    { icon: 'fa-credit-card', title: 'Métodos de pago', desc: 'Tarjetas guardadas' },
                    { icon: 'fa-shield-halved', title: 'Seguridad y Privacidad', desc: 'FaceID, contraseñas' },
                    { icon: 'fa-headset', title: 'Centro de ayuda', desc: 'Contacto y preguntas frecuentes' }
                  ].map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.2rem', background: 'var(--theme-surface-bg)', borderRadius: '12px', cursor: 'pointer' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--theme-primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--theme-accent)' }}>
                        <i className={`fas ${item.icon}`}></i>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: 'var(--theme-text-main)' }}>{item.title}</div>
                        <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>{item.desc}</div>
                      </div>
                      <i className="fas fa-chevron-right" style={{ color: '#D1D5DB' }}></i>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {flightTab === 'BOARDING' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: 700 }}>Mis Viajes</h3>
                
                <div style={{ background: 'var(--theme-surface-bg)', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', position: 'relative', overflow: 'hidden' }}>
                  
                  <div style={{ display: 'inline-block', background: 'var(--theme-accent)', color: '#FFF', fontSize: '0.7rem', fontWeight: 800, padding: '0.3rem 0.6rem', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1.5rem' }}>Próximo Vuelo</div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <div style={{ fontSize: '2.5rem', fontWeight: 900, lineHeight: 1 }}>{flightOrigin.substring(0, 3).toUpperCase()}</div>
                      <div style={{ fontSize: '0.8rem', color: '#6B7280', marginTop: '4px' }}>Madrid</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, padding: '0 1rem' }}>
                      <i className="fas fa-plane" style={{ fontSize: '1.5rem', color: 'var(--theme-accent)', marginBottom: '8px' }}></i>
                      <div style={{ width: '100%', borderBottom: '2px dashed #E5E7EB' }}></div>
                      <span style={{ fontSize: '0.7rem', color: '#9CA3AF', marginTop: '8px' }}>Directo</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <div style={{ fontSize: '2.5rem', fontWeight: 900, lineHeight: 1 }}>{(flightDest || 'PAR').substring(0, 3).toUpperCase()}</div>
                      <div style={{ fontSize: '0.8rem', color: '#6B7280', marginTop: '4px' }}>{flightDest ? flightDest.split(',')[0] : 'París'}</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'var(--theme-primary-bg)', padding: '1rem', borderRadius: '12px', marginBottom: '2rem' }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#9CA3AF', textTransform: 'uppercase' }}>Pasajero</div>
                      <div style={{ fontWeight: 700, color: 'var(--theme-text-main)' }}>Usuario Demo</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#9CA3AF', textTransform: 'uppercase' }}>Fecha</div>
                      <div style={{ fontWeight: 700, color: 'var(--theme-text-main)' }}>{flightDate}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#9CA3AF', textTransform: 'uppercase' }}>Vuelo</div>
                      <div style={{ fontWeight: 700, color: 'var(--theme-text-main)' }}>BA-409</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#9CA3AF', textTransform: 'uppercase' }}>Clase</div>
                      <div style={{ fontWeight: 700, color: 'var(--theme-text-main)' }}>{flightClass}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#9CA3AF', textTransform: 'uppercase' }}>Puerta</div>
                      <div style={{ fontWeight: 700, color: 'var(--theme-text-main)' }}>C42</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#9CA3AF', textTransform: 'uppercase' }}>Asiento</div>
                      <div style={{ fontWeight: 700, color: 'var(--theme-text-main)' }}>12A</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.8rem', background: 'var(--theme-primary-bg)', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--theme-text-main)' }}>
                      <i className="fas fa-briefcase"></i> 1x Mano (10kg)
                    </div>
                    {flightBaggageAdded && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.8rem', background: 'var(--theme-primary-bg)', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--theme-text-main)' }}>
                        <i className="fas fa-suitcase-rolling"></i> 1x Bodega (20kg)
                      </div>
                    )}
                  </div>

                  <div style={{ background: '#FFF', padding: '1.5rem 1rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid #E5E7EB' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="fas fa-qrcode" style={{ fontSize: '6rem', color: '#000' }}></i>
                      <span style={{ fontSize: '0.6rem', color: '#9CA3AF', marginTop: '0.5rem', letterSpacing: '2px' }}>BA409-USER-12A</span>
                    </div>
                  </div>
                  
                  {setTimeout(() => handleFlightObjectiveCheck(), 100) as unknown as null}
                </div>
              </div>
            )}
            
            {flightTab === 'EXPLORE' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h3 style={{ margin: '0', fontSize: '1.5rem', fontWeight: 700 }}>Explorar</h3>
                
                <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', height: '200px' }}>
                  <img src="https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=800&auto=format&fit=crop" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Destinos" />
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '1.5rem' }}>
                    <div style={{ color: '#FFF', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Destino Destacado</div>
                    <div style={{ color: '#FFF', fontSize: '1.8rem', fontWeight: 800 }}>Tokio, Japón</div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
                    <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Ofertas última hora 🔥</h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--theme-accent)', fontWeight: 600, cursor: 'pointer' }}>Ver todo</span>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {[
                      { dest: 'Londres (LHR)', oldPrice: 195, newPrice: 150, discount: '-23%', date: 'Mañana', img: 'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?q=80&w=400&auto=format&fit=crop' },
                      { dest: 'Roma (FCO)', oldPrice: 220, newPrice: 165, discount: '-25%', date: 'Este finde', img: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=400&auto=format&fit=crop' },
                      { dest: 'Berlín (BER)', oldPrice: 150, newPrice: 90, discount: '-40%', date: 'Próx martes', img: 'https://images.unsplash.com/photo-1560969184-10fe8719e047?q=80&w=400&auto=format&fit=crop' },
                      { dest: 'Nueva York (JFK)', oldPrice: 650, newPrice: 420, discount: '-35%', date: 'Próxima semana', img: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=400&auto=format&fit=crop' },
                      { dest: 'Dubái (DXB)', oldPrice: 580, newPrice: 480, discount: '-17%', date: 'En 3 días', img: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=400&auto=format&fit=crop' },
                      { dest: 'Bali (DPS)', oldPrice: 850, newPrice: 620, discount: '-27%', date: 'Sábado', img: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=400&auto=format&fit=crop' }
                    ].map((offer, i) => (
                      <div key={i} style={{ display: 'flex', background: 'var(--theme-surface-bg)', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', cursor: 'pointer' }} onClick={() => { setFlightDest(offer.dest); setFlightTab('SEARCH'); setFlightSearchStep('FORM'); }}>
                        <div style={{ width: '100px', height: '100px' }}>
                          <img src={offer.img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={offer.dest} />
                        </div>
                        <div style={{ padding: '0.8rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{offer.dest}</div>
                            <div style={{ fontSize: '0.8rem', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
                              <i className="far fa-calendar-alt"></i> {offer.date}
                            </div>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontSize: '0.8rem', color: '#9CA3AF', textDecoration: 'line-through' }}>{offer.oldPrice}€</span>
                              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--theme-text-main)' }}>{offer.newPrice}€</span>
                            </div>
                            <div style={{ background: '#FEE2E2', color: '#EF4444', fontSize: '0.7rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                              {offer.discount}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {flightTab !== 'SEARCH' && flightTab !== 'BOARDING' && flightTab !== 'PROFILE' && flightTab !== 'EXPLORE' && (
               <div style={{ padding: '2rem', textAlign: 'center', color: '#9CA3AF' }}>Sección en construcción</div>
            )}
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-around', padding: '1rem', background: 'var(--theme-surface-bg)', borderTop: '1px solid #E5E7EB', zIndex: 100 }}>
            <button onClick={() => setFlightTab('SEARCH')} style={{ background: 'none', border: 'none', color: flightTab === 'SEARCH' ? 'var(--theme-accent)' : '#9CA3AF' }}><i className="fas fa-search"></i><div style={{ fontSize: '0.6rem', marginTop: '4px' }}>Buscar</div></button>
            <button onClick={() => setFlightTab('EXPLORE')} style={{ background: 'none', border: 'none', color: flightTab === 'EXPLORE' ? 'var(--theme-accent)' : '#9CA3AF' }}><i className="fas fa-compass"></i><div style={{ fontSize: '0.6rem', marginTop: '4px' }}>Explorar</div></button>
            <button onClick={() => setFlightTab('BOARDING')} style={{ background: 'none', border: 'none', color: flightTab === 'BOARDING' ? 'var(--theme-accent)' : '#9CA3AF' }}><i className="fas fa-ticket-simple"></i><div style={{ fontSize: '0.6rem', marginTop: '4px' }}>Viajes</div></button>
            <button onClick={() => setFlightTab('NOTIFICATIONS')} style={{ background: 'none', border: 'none', color: flightTab === 'NOTIFICATIONS' ? 'var(--theme-accent)' : '#9CA3AF' }}><i className="fas fa-bell"></i><div style={{ fontSize: '0.6rem', marginTop: '4px' }}>Avisos</div></button>
            <button onClick={() => setFlightTab('PROFILE')} style={{ background: 'none', border: 'none', color: flightTab === 'PROFILE' ? 'var(--theme-accent)' : '#9CA3AF' }}><i className="fas fa-user"></i><div style={{ fontSize: '0.6rem', marginTop: '4px' }}>Perfil</div></button>
          </div>
        </div>
      );
    }

    // Glassmorphism Theme: Side/Top Navigation mixed, blur effects
    if (version === 1) {
      return (
        <div className="flight-app glass-theme" style={{ position: 'relative', height: '100%', background: 'linear-gradient(135deg, #1E1E2F 0%, #3A2E5D 100%)', color: 'var(--theme-text-main)', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'rgba(167, 139, 250, 0.4)', borderRadius: '50%', filter: 'blur(50px)' }}></div>
          <div style={{ position: 'absolute', bottom: '-50px', left: '-50px', width: '250px', height: '250px', background: 'rgba(56, 189, 248, 0.3)', borderRadius: '50%', filter: 'blur(60px)' }}></div>
          
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ padding: '1.5rem', flex: 1, overflowY: 'auto', paddingBottom: '90px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 300, letterSpacing: '2px', margin: 0, color: '#FFF' }}>SKY LINK</h2>
                <img src="https://ui-avatars.com/api/?name=User&background=random" style={{ width: '32px', borderRadius: '50%' }} alt="User" />
              </div>

              {flightTab === 'SEARCH' && flightSearchStep === 'FORM' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', borderRadius: '12px', padding: '0.25rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <button onClick={() => setFlightTripType('IDA_VUELTA')} style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', background: flightTripType === 'IDA_VUELTA' ? 'rgba(255,255,255,0.1)' : 'transparent', color: '#FFF', border: 'none', fontWeight: 600, transition: 'all 0.2s', cursor: 'pointer' }}>Ida y vuelta</button>
                    <button onClick={() => setFlightTripType('SOLO_IDA')} style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', background: flightTripType === 'SOLO_IDA' ? 'rgba(255,255,255,0.1)' : 'transparent', color: '#FFF', border: 'none', fontWeight: 600, transition: 'all 0.2s', cursor: 'pointer' }}>Solo ida</button>
                  </div>
                  
                  <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <label style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>Origen</label>
                    <input type="text" value={flightOrigin} readOnly style={{ width: '100%', border: 'none', background: 'transparent', fontSize: '1.1rem', marginTop: '0.2rem', outline: 'none', color: '#FFF' }} />
                  </div>
                  <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <label style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>Destino</label>
                    <input type="text" value={flightDest} onChange={(e) => setFlightDest(e.target.value)} placeholder="¿A dónde viajas?" style={{ width: '100%', border: 'none', background: 'transparent', fontSize: '1.1rem', marginTop: '0.2rem', outline: 'none', color: '#FFF' }} />
                  </div>
                  
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1, padding: '1rem', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', borderRadius: '12px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }} onClick={(e) => { const i = e.currentTarget.querySelector('input'); if(i && i.showPicker) { try { i.showPicker() } catch(err){} } }}>
                      <label style={{ fontSize: '0.8rem', color: '#9CA3AF', cursor: 'pointer' }}>Fecha Ida</label>
                      <input type="date" value={flightDate} onChange={(e) => setFlightDate(e.target.value)} onClick={(e) => { e.stopPropagation(); try { if ((e.target as any).showPicker) (e.target as any).showPicker(); } catch(err){} }} style={{ width: '100%', border: 'none', background: 'transparent', fontSize: '1rem', marginTop: '0.2rem', outline: 'none', color: '#FFF', cursor: 'pointer', padding: 0 }} />
                    </div>
                    {flightTripType === 'IDA_VUELTA' && (
                      <div style={{ flex: 1, padding: '1rem', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', borderRadius: '12px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }} onClick={(e) => { const i = e.currentTarget.querySelector('input'); if(i && i.showPicker) { try { i.showPicker() } catch(err){} } }}>
                        <label style={{ fontSize: '0.8rem', color: '#9CA3AF', cursor: 'pointer' }}>Fecha Vuelta</label>
                        <input type="date" value={flightReturnDate} onChange={(e) => setFlightReturnDate(e.target.value)} onClick={(e) => { e.stopPropagation(); try { if ((e.target as any).showPicker) (e.target as any).showPicker(); } catch(err){} }} style={{ width: '100%', border: 'none', background: 'transparent', fontSize: '1rem', marginTop: '0.2rem', outline: 'none', color: '#FFF', cursor: 'pointer', padding: 0 }} />
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1, padding: '1rem', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <label style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>Pasajeros</label>
                      <select value={flightPassengers} onChange={e => setFlightPassengers(Number(e.target.value))} style={{ width: '100%', border: 'none', background: 'transparent', fontSize: '1rem', marginTop: '0.2rem', color: '#FFF', padding: 0 }}>
                        {[1,2,3,4,5].map(n => <option key={n} value={n} style={{ color: '#000' }}>{n} Pasajeros</option>)}
                      </select>
                    </div>
                    <div style={{ flex: 1, padding: '1rem', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <label style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>Clase</label>
                      <select value={flightClass} onChange={e => setFlightClass(e.target.value as any)} style={{ width: '100%', border: 'none', background: 'transparent', fontSize: '1rem', marginTop: '0.2rem', color: '#FFF', padding: 0 }}>
                        <option value="TURISTA" style={{ color: '#000' }}>Turista</option>
                        <option value="BUSINESS" style={{ color: '#000' }}>Business</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: flightBaggageAdded ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', border: flightBaggageAdded ? '1px solid #FFF' : '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', transition: 'all 0.2s' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.9rem', color: '#FFF', fontWeight: 600 }}>Equipaje bodega (+35€)</span>
                      <span style={{ fontSize: '0.8rem', color: flightBaggageAdded ? '#FFF' : '#9CA3AF' }}>{flightBaggageAdded ? 'Añadido' : 'Opcional'}</span>
                    </div>
                    <label className="toggle-switch" style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
                      <input type="checkbox" checked={flightBaggageAdded} onChange={(e) => { if (e.target.checked) addBaggage(); else setFlightBaggageAdded(false); }} style={{ opacity: 0, width: 0, height: 0 }} />
                      <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: flightBaggageAdded ? 'var(--theme-accent)' : 'rgba(255,255,255,0.2)', transition: '.4s', borderRadius: '24px' }}>
                        <span style={{ position: 'absolute', content: '""', height: '18px', width: '18px', left: flightBaggageAdded ? '23px' : '3px', bottom: '3px', backgroundColor: 'white', transition: '.4s', borderRadius: '50%', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}></span>
                      </span>
                    </label>
                  </div>

                  <button onClick={() => setFlightSearchStep('RESULTS')} style={{ padding: '1rem', background: 'var(--theme-accent)', color: '#FFF', border: 'none', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 600, marginTop: '1rem', cursor: 'pointer', boxShadow: '0 4px 15px rgba(167, 139, 250, 0.4)' }}>Buscar Vuelos</button>
                </div>
              )}

              {flightTab === 'SEARCH' && flightSearchStep === 'RESULTS' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <button onClick={() => setFlightSearchStep('FORM')} style={{ background: 'none', border: 'none', color: '#FFF', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0', fontSize: '1rem', fontWeight: 600 }}>
                    <i className="fas fa-arrow-left"></i> Volver a buscar
                  </button>
                  <div style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#FFF' }}>{flightOrigin.split(' ')[0]} <i className="fas fa-plane" style={{ margin: '0 0.5rem', color: '#9CA3AF', fontSize: '1rem' }}></i> {flightDest || 'París'}</div>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#9CA3AF', marginTop: '0.5rem' }}>
                      {flightDate} {flightTripType === 'IDA_VUELTA' ? ` - ${flightReturnDate}` : ''} • {flightPassengers} Pasajeros • {flightClass}
                    </div>
                  </div>
                  
                  <h3 style={{ fontSize: '1.1rem', margin: '1rem 0 0.5rem 0', fontWeight: 300, letterSpacing: '1px', color: '#FFF' }}>Vuelos de ida</h3>
                  
                  {[
                    { id: 1, start: '06:15', end: '09:00', dur: '2h 45m', stops: 'Directo', price: flightClass === 'BUSINESS' ? 320 : 85 },
                    { id: 2, start: '08:30', end: '11:15', dur: '2h 45m', stops: 'Directo', price: flightClass === 'BUSINESS' ? 350 : 120 },
                    { id: 3, start: '10:00', end: '13:30', dur: '3h 30m', stops: '1 Escala', price: flightClass === 'BUSINESS' ? 290 : 75 },
                    { id: 4, start: '14:00', end: '16:45', dur: '2h 45m', stops: 'Directo', price: flightClass === 'BUSINESS' ? 380 : 160 },
                    { id: 5, start: '18:20', end: '21:05', dur: '2h 45m', stops: 'Directo', price: flightClass === 'BUSINESS' ? 340 : 110 },
                    { id: 6, start: '21:45', end: '00:30', dur: '2h 45m', stops: 'Directo', price: flightClass === 'BUSINESS' ? 280 : 65 },
                  ].map(f => (
                    <div key={f.id} style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', padding: '1rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#FFF' }}>{f.start}</div>
                            <div style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>{flightOrigin.substring(0, 3).toUpperCase()}</div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '60px' }}>
                            <span style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>{f.dur}</span>
                            <div style={{ height: '2px', width: '100%', background: 'rgba(255,255,255,0.2)', position: 'relative', margin: '4px 0' }}><i className="fas fa-plane" style={{ position: 'absolute', right: '-5px', top: '-6px', color: '#9CA3AF', fontSize: '0.8rem' }}></i></div>
                            <span style={{ fontSize: '0.7rem', color: f.stops === 'Directo' ? '#38BDF8' : '#FBBF24' }}>{f.stops}</span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#FFF' }}>{f.end}</div>
                            <div style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>{(flightDest || 'PAR').substring(0, 3).toUpperCase()}</div>
                          </div>
                        </div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFF' }}>{f.price + (flightBaggageAdded ? 35 : 0)}€</div>
                      </div>
                      <button onClick={() => setFlightSearchStep('CHECKOUT')} style={{ background: 'var(--theme-accent)', color: '#FFF', border: 'none', padding: '0.75rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 10px rgba(167, 139, 250, 0.3)' }}>Seleccionar</button>
                    </div>
                  ))}
                </div>
              )}

              {flightTab === 'SEARCH' && flightSearchStep === 'CHECKOUT' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <button onClick={() => setFlightSearchStep('RESULTS')} style={{ background: 'none', border: 'none', color: '#FFF', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0', fontSize: '1rem', fontWeight: 600 }}>
                    <i className="fas fa-arrow-left"></i> Cambiar vuelo
                  </button>
                  <div style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', fontWeight: 300, color: '#FFF' }}>Resumen del pago</h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ color: '#9CA3AF' }}>Vuelo base</span>
                      <span style={{ color: '#FFF' }}>120€</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ color: '#9CA3AF' }}>Tasas e impuestos</span>
                      <span style={{ color: '#FFF' }}>15€</span>
                    </div>
                    {flightBaggageAdded && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ color: '#9CA3AF' }}>Equipaje (20kg)</span>
                        <span style={{ color: '#FFF' }}>35€</span>
                      </div>
                    )}
                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.2)', margin: '1rem 0' }}></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.2rem', color: '#FFF' }}>
                      <span>Total a pagar</span>
                      <span style={{ color: 'var(--theme-accent)' }}>{135 + (flightBaggageAdded ? 35 : 0)}€</span>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 300, color: '#FFF' }}>Método de pago</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div onClick={() => setFlightPaymentMethod('CARD')} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', border: flightPaymentMethod === 'CARD' ? '1px solid var(--theme-accent)' : '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', background: flightPaymentMethod === 'CARD' ? 'rgba(255,255,255,0.1)' : 'transparent', cursor: 'pointer' }}>
                        <i className="fas fa-credit-card" style={{ fontSize: '1.5rem', color: flightPaymentMethod === 'CARD' ? 'var(--theme-accent)' : '#9CA3AF' }}></i>
                        <div>
                          <div style={{ fontWeight: 600, color: '#FFF' }}>Tarjeta</div>
                          <div style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>Visa, Mastercard, Amex</div>
                        </div>
                      </div>
                      <div onClick={() => setFlightPaymentMethod('PAYPAL')} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', border: flightPaymentMethod === 'PAYPAL' ? '1px solid var(--theme-accent)' : '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', background: flightPaymentMethod === 'PAYPAL' ? 'rgba(255,255,255,0.1)' : 'transparent', cursor: 'pointer' }}>
                        <i className="fab fa-paypal" style={{ fontSize: '1.5rem', color: flightPaymentMethod === 'PAYPAL' ? '#38BDF8' : '#9CA3AF' }}></i>
                        <div>
                          <div style={{ fontWeight: 600, color: '#FFF' }}>PayPal</div>
                          <div style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>Paga de forma segura</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button onClick={() => { setFlightBooked(true); setTimeout(() => handleFlightObjectiveCheck(), 100); }} style={{ padding: '1.2rem', background: 'var(--theme-accent)', color: '#FFF', border: 'none', borderRadius: '12px', fontSize: '1.2rem', fontWeight: 700, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 15px rgba(167, 139, 250, 0.4)' }}>
                    <i className="fas fa-lock"></i> Pagar ahora
                  </button>
                </div>
              )}

              {flightTab === 'PROFILE' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)', backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '1.5rem', color: '#FFF', position: 'relative', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.2)' }}>
                    <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: 'rgba(56, 189, 248, 0.3)', borderRadius: '50%', filter: 'blur(30px)' }}></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
                      <div>
                        <div style={{ fontSize: '0.9rem', color: '#D1D5DB', textTransform: 'uppercase', letterSpacing: '1px' }}>Sky Link Diamond</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 600, marginTop: '0.2rem' }}>Usuario VIP</div>
                      </div>
                      <i className="fas fa-gem" style={{ color: '#38BDF8', fontSize: '2rem', opacity: 0.9 }}></i>
                    </div>
                    <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
                      <div>
                        <div style={{ fontSize: '2rem', fontWeight: 300, lineHeight: 1 }}>45,200</div>
                        <div style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>Millas disponibles</div>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>ID: 991-GLS-X</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {[
                      { icon: 'fa-id-card', title: 'Información y documentos', desc: 'Pasaporte, visados' },
                      { icon: 'fa-sliders', title: 'Preferencias de viaje', desc: 'Asientos, comida, aeropuerto' },
                      { icon: 'fa-credit-card', title: 'Métodos de pago', desc: 'Tarjetas guardadas' },
                      { icon: 'fa-shield-halved', title: 'Seguridad y Privacidad', desc: 'FaceID, contraseñas' },
                      { icon: 'fa-headset', title: 'Centro de ayuda', desc: 'Contacto y soporte' }
                    ].map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.2rem', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', borderRadius: '12px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
                          <i className={`fas ${item.icon}`}></i>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, color: '#FFF' }}>{item.title}</div>
                          <div style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>{item.desc}</div>
                        </div>
                        <i className="fas fa-chevron-right" style={{ color: 'rgba(255,255,255,0.3)' }}></i>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {flightTab === 'BOARDING' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: 300, letterSpacing: '1px', color: '#FFF' }}>Tus Viajes</h3>
                  
                  <div style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(15px)', borderRadius: '16px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.2)', position: 'relative', overflow: 'hidden' }}>
                    
                    <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#FFF', fontSize: '0.7rem', fontWeight: 600, padding: '0.3rem 0.6rem', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1.5rem' }}>Próximo Vuelo</div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ fontSize: '2.5rem', fontWeight: 300, lineHeight: 1, color: '#FFF' }}>{flightOrigin.substring(0, 3).toUpperCase()}</div>
                        <div style={{ fontSize: '0.8rem', color: '#9CA3AF', marginTop: '4px' }}>Madrid</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, padding: '0 1rem' }}>
                        <i className="fas fa-plane" style={{ fontSize: '1.5rem', color: 'var(--theme-accent)', marginBottom: '8px' }}></i>
                        <div style={{ width: '100%', borderBottom: '1px solid rgba(255,255,255,0.2)' }}></div>
                        <span style={{ fontSize: '0.7rem', color: '#9CA3AF', marginTop: '8px' }}>Directo</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <div style={{ fontSize: '2.5rem', fontWeight: 300, lineHeight: 1, color: '#FFF' }}>{(flightDest || 'PAR').substring(0, 3).toUpperCase()}</div>
                        <div style={{ fontSize: '0.8rem', color: '#9CA3AF', marginTop: '4px' }}>{flightDest ? flightDest.split(',')[0] : 'París'}</div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px', marginBottom: '2rem' }}>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: '#9CA3AF', textTransform: 'uppercase' }}>Pasajero</div>
                        <div style={{ fontWeight: 600, color: '#FFF' }}>Usuario VIP</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: '#9CA3AF', textTransform: 'uppercase' }}>Fecha</div>
                        <div style={{ fontWeight: 600, color: '#FFF' }}>{flightDate}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: '#9CA3AF', textTransform: 'uppercase' }}>Vuelo</div>
                        <div style={{ fontWeight: 600, color: '#FFF' }}>GLS-404</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: '#9CA3AF', textTransform: 'uppercase' }}>Asiento</div>
                        <div style={{ fontWeight: 600, color: '#FFF' }}>{flightClass === 'BUSINESS' ? '2A' : '14C'}</div>
                      </div>
                    </div>

                    <div style={{ background: '#FFF', padding: '1rem', borderRadius: '12px', display: 'flex', justifyContent: 'center' }}>
                      <i className="fas fa-qrcode" style={{ fontSize: '6rem', color: '#000' }}></i>
                    </div>
                    
                    {setTimeout(() => handleFlightObjectiveCheck(), 100) as unknown as null}
                  </div>
                </div>
              )}

              {flightTab === 'EXPLORE' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <h3 style={{ margin: '0', fontSize: '1.5rem', fontWeight: 300, letterSpacing: '1px', color: '#FFF' }}>Explorar</h3>
                  
                  <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', height: '200px', border: '1px solid rgba(255,255,255,0.2)' }}>
                    <img src="https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=800&auto=format&fit=crop" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Destinos" />
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '1.5rem' }}>
                      <div style={{ color: '#FFF', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Destino Destacado</div>
                      <div style={{ color: '#FFF', fontSize: '1.8rem', fontWeight: 300 }}>Tokio, Japón</div>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
                      <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 300, letterSpacing: '1px', color: '#FFF' }}>Ofertas última hora 🔥</h4>
                      <span style={{ fontSize: '0.8rem', color: '#38BDF8', cursor: 'pointer' }}>Ver todo</span>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {[
                        { dest: 'Londres (LHR)', oldPrice: 195, newPrice: 150, discount: '-23%', date: 'Mañana', img: 'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?q=80&w=400&auto=format&fit=crop' },
                        { dest: 'Roma (FCO)', oldPrice: 220, newPrice: 165, discount: '-25%', date: 'Este finde', img: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=400&auto=format&fit=crop' },
                        { dest: 'Berlín (BER)', oldPrice: 150, newPrice: 90, discount: '-40%', date: 'Próx martes', img: 'https://images.unsplash.com/photo-1560969184-10fe8719e047?q=80&w=400&auto=format&fit=crop' },
                        { dest: 'Nueva York (JFK)', oldPrice: 650, newPrice: 420, discount: '-35%', date: 'Próxima semana', img: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=400&auto=format&fit=crop' },
                        { dest: 'Dubái (DXB)', oldPrice: 580, newPrice: 480, discount: '-17%', date: 'En 3 días', img: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=400&auto=format&fit=crop' },
                        { dest: 'Bali (DPS)', oldPrice: 850, newPrice: 620, discount: '-27%', date: 'Sábado', img: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=400&auto=format&fit=crop' }
                      ].map((offer, i) => (
                        <div key={i} style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }} onClick={() => { setFlightDest(offer.dest); setFlightTab('SEARCH'); setFlightSearchStep('FORM'); }}>
                          <div style={{ width: '100px', height: '100px' }}>
                            <img src={offer.img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={offer.dest} />
                          </div>
                          <div style={{ padding: '0.8rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '1.1rem', color: '#FFF' }}>{offer.dest}</div>
                              <div style={{ fontSize: '0.8rem', color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
                                <i className="far fa-calendar-alt"></i> {offer.date}
                              </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', textDecoration: 'line-through' }}>{offer.oldPrice}€</span>
                                <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#38BDF8' }}>{offer.newPrice}€</span>
                              </div>
                              <div style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.5)', color: '#FCA5A5', fontSize: '0.7rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                                {offer.discount}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {flightTab !== 'SEARCH' && flightTab !== 'BOARDING' && flightTab !== 'PROFILE' && flightTab !== 'EXPLORE' && (
                 <div style={{ padding: '2rem', textAlign: 'center', color: '#9CA3AF' }}>Sección en construcción</div>
              )}
            </div>

            <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'space-around', padding: '1rem', background: 'rgba(30, 30, 47, 0.8)', backdropFilter: 'blur(15px)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <button onClick={() => setFlightTab('SEARCH')} style={{ background: 'none', border: 'none', color: flightTab === 'SEARCH' ? 'var(--theme-accent)' : '#9CA3AF', cursor: 'pointer' }}><i className="fas fa-search"></i><div style={{ fontSize: '0.6rem', marginTop: '4px' }}>Buscar</div></button>
              <button onClick={() => setFlightTab('EXPLORE')} style={{ background: 'none', border: 'none', color: flightTab === 'EXPLORE' ? 'var(--theme-accent)' : '#9CA3AF', cursor: 'pointer' }}><i className="fas fa-compass"></i><div style={{ fontSize: '0.6rem', marginTop: '4px' }}>Explorar</div></button>
              <button onClick={() => setFlightTab('BOARDING')} style={{ background: 'none', border: 'none', color: flightTab === 'BOARDING' ? 'var(--theme-accent)' : '#9CA3AF', cursor: 'pointer' }}><i className="fas fa-ticket-simple"></i><div style={{ fontSize: '0.6rem', marginTop: '4px' }}>Viajes</div></button>
              <button onClick={() => setFlightTab('NOTIFICATIONS')} style={{ background: 'none', border: 'none', color: flightTab === 'NOTIFICATIONS' ? 'var(--theme-accent)' : '#9CA3AF', cursor: 'pointer' }}><i className="fas fa-bell"></i><div style={{ fontSize: '0.6rem', marginTop: '4px' }}>Avisos</div></button>
              <button onClick={() => setFlightTab('PROFILE')} style={{ background: 'none', border: 'none', color: flightTab === 'PROFILE' ? 'var(--theme-accent)' : '#9CA3AF', cursor: 'pointer' }}><i className="fas fa-user"></i><div style={{ fontSize: '0.6rem', marginTop: '4px' }}>Perfil</div></button>
            </div>
          </div>
        </div>
      );
    }


    // Brutalist Theme: Floating action buttons, large blocks, neon colors
    if (version === 2) {
      return (
        <div className="flight-app brutal-theme" style={{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '100%', background: '#FCDE2D', color: '#000', fontFamily: '"Space Grotesk", "Helvetica Neue", sans-serif', overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', borderBottom: '4px solid #000', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', background: '#FCDE2D' }}>
            <h1 style={{ fontSize: '3rem', fontWeight: 900, textTransform: 'uppercase', margin: 0, lineHeight: 0.9, letterSpacing: '-2px' }}>VUELING</h1>
            <div style={{ fontWeight: 800, fontSize: '1rem', border: '2px solid #000', padding: '0.25rem 0.5rem', transform: 'rotate(-3deg)', background: '#D9F99D', boxShadow: '2px 2px 0px #000' }}>EST. 2026</div>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', paddingBottom: '90px' }}>
            {flightTab === 'SEARCH' && flightSearchStep === 'FORM' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', border: '4px solid #000', background: '#FFF', boxShadow: '4px 4px 0px #000' }}>
                  <button onClick={() => setFlightTripType('IDA_VUELTA')} style={{ flex: 1, padding: '1rem', background: flightTripType === 'IDA_VUELTA' ? '#000' : 'transparent', color: flightTripType === 'IDA_VUELTA' ? '#FFF' : '#000', border: 'none', borderRight: '4px solid #000', fontWeight: 900, fontSize: '1.1rem', cursor: 'pointer', textTransform: 'uppercase' }}>IDA Y VUELTA</button>
                  <button onClick={() => setFlightTripType('SOLO_IDA')} style={{ flex: 1, padding: '1rem', background: flightTripType === 'SOLO_IDA' ? '#000' : 'transparent', color: flightTripType === 'SOLO_IDA' ? '#FFF' : '#000', border: 'none', fontWeight: 900, fontSize: '1.1rem', cursor: 'pointer', textTransform: 'uppercase' }}>SOLO IDA</button>
                </div>
                
                <div style={{ border: '4px solid #000', padding: '1rem 1.5rem', background: '#FFF', boxShadow: '6px 6px 0px #000', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '-14px', left: '16px', background: '#000', color: '#FFF', padding: '4px 12px', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '1px' }}>FROM</div>
                  <input type="text" value={flightOrigin} readOnly style={{ width: '100%', background: 'transparent', border: 'none', color: '#000', fontSize: '2rem', fontWeight: 900, outline: 'none', textTransform: 'uppercase', letterSpacing: '-1px', marginTop: '0.5rem' }} />
                </div>

                <div style={{ border: '4px solid #000', padding: '1rem 1.5rem', background: '#D9F99D', boxShadow: '6px 6px 0px #000', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '-14px', left: '16px', background: '#000', color: '#FFF', padding: '4px 12px', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '1px' }}>TO</div>
                  <input type="text" value={flightDest} onChange={(e) => setFlightDest(e.target.value)} placeholder="WHERE TO?" style={{ width: '100%', background: 'transparent', border: 'none', color: '#000', fontSize: '2rem', fontWeight: 900, outline: 'none', textTransform: 'uppercase', letterSpacing: '-1px', marginTop: '0.5rem' }} />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ flex: 1, padding: '1rem', background: '#FFF', border: '4px solid #000', boxShadow: '4px 4px 0px #000', position: 'relative', cursor: 'pointer' }} onClick={(e) => { const i = e.currentTarget.querySelector('input'); if(i && i.showPicker) { try { i.showPicker() } catch(err){} } }}>
                    <div style={{ position: 'absolute', top: '-12px', left: '10px', background: '#000', color: '#FFF', padding: '2px 8px', fontWeight: 800, fontSize: '0.7rem' }}>DEPART</div>
                    <input type="date" value={flightDate} onChange={(e) => setFlightDate(e.target.value)} onClick={(e) => { e.stopPropagation(); try { if ((e.target as any).showPicker) (e.target as any).showPicker(); } catch(err){} }} style={{ width: '100%', minWidth: 0, border: 'none', background: 'transparent', fontSize: '1.2rem', fontWeight: 900, outline: 'none', color: '#000', cursor: 'pointer', padding: 0, marginTop: '0.5rem' }} />
                  </div>
                  {flightTripType === 'IDA_VUELTA' && (
                    <div style={{ flex: 1, padding: '1rem', background: '#FFF', border: '4px solid #000', boxShadow: '4px 4px 0px #000', position: 'relative', cursor: 'pointer' }} onClick={(e) => { const i = e.currentTarget.querySelector('input'); if(i && i.showPicker) { try { i.showPicker() } catch(err){} } }}>
                      <div style={{ position: 'absolute', top: '-12px', left: '10px', background: '#000', color: '#FFF', padding: '2px 8px', fontWeight: 800, fontSize: '0.7rem' }}>RETURN</div>
                      <input type="date" value={flightReturnDate} onChange={(e) => setFlightReturnDate(e.target.value)} onClick={(e) => { e.stopPropagation(); try { if ((e.target as any).showPicker) (e.target as any).showPicker(); } catch(err){} }} style={{ width: '100%', minWidth: 0, border: 'none', background: 'transparent', fontSize: '1.2rem', fontWeight: 900, outline: 'none', color: '#000', cursor: 'pointer', padding: 0, marginTop: '0.5rem' }} />
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1, padding: '1rem', background: '#FFF', border: '4px solid #000', boxShadow: '4px 4px 0px #000', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '-12px', left: '10px', background: '#000', color: '#FFF', padding: '2px 8px', fontWeight: 800, fontSize: '0.7rem' }}>PASSENGERS</div>
                    <select value={flightPassengers} onChange={e => setFlightPassengers(Number(e.target.value))} style={{ width: '100%', border: 'none', background: 'transparent', fontSize: '1.2rem', fontWeight: 900, outline: 'none', color: '#000', padding: 0, marginTop: '0.5rem', textTransform: 'uppercase' }}>
                      {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} PAX</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1, padding: '1rem', background: '#FFF', border: '4px solid #000', boxShadow: '4px 4px 0px #000', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '-12px', left: '10px', background: '#000', color: '#FFF', padding: '2px 8px', fontWeight: 800, fontSize: '0.7rem' }}>CLASS</div>
                    <select value={flightClass} onChange={e => setFlightClass(e.target.value as any)} style={{ width: '100%', border: 'none', background: 'transparent', fontSize: '1.2rem', fontWeight: 900, outline: 'none', color: '#000', padding: 0, marginTop: '0.5rem', textTransform: 'uppercase' }}>
                      <option value="TURISTA">ECO</option>
                      <option value="BUSINESS">BIZ</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', background: flightBaggageAdded ? '#A5B4FC' : '#FFF', border: '4px solid #000', boxShadow: '6px 6px 0px #000', cursor: 'pointer' }} onClick={() => setFlightBaggageAdded(!flightBaggageAdded)}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '1.2rem', fontWeight: 900, textTransform: 'uppercase' }}>BAGGAGE (20KG)</span>
                    <span style={{ fontSize: '1rem', fontWeight: 800, color: flightBaggageAdded ? '#000' : '#6B7280' }}>{flightBaggageAdded ? 'ADDED [+35€]' : 'OPTIONAL [+35€]'}</span>
                  </div>
                  <div style={{ width: '32px', height: '32px', border: '4px solid #000', background: flightBaggageAdded ? '#000' : '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {flightBaggageAdded && <i className="fas fa-check" style={{ color: '#FFF' }}></i>}
                  </div>
                </div>

                <button onClick={() => setFlightSearchStep('RESULTS')} style={{ width: '100%', padding: '1.5rem', background: '#000', color: '#FFF', border: 'none', fontSize: '2rem', fontWeight: 900, cursor: 'pointer', textTransform: 'uppercase', marginTop: '1rem', boxShadow: '6px 6px 0px #FCA5A5', letterSpacing: '2px' }}>SEARCH FLIGHTS</button>
              </div>
            )}

            {flightTab === 'SEARCH' && flightSearchStep === 'RESULTS' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <button onClick={() => setFlightSearchStep('FORM')} style={{ background: 'none', border: 'none', color: '#000', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0', fontSize: '1.2rem', fontWeight: 900, textTransform: 'uppercase' }}>
                  <i className="fas fa-arrow-left"></i> EDIT SEARCH
                </button>
                <div style={{ background: '#FFF', border: '4px solid #000', padding: '1.5rem', boxShadow: '6px 6px 0px #000' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, textTransform: 'uppercase' }}>{flightOrigin.split(' ')[0]} <i className="fas fa-plane" style={{ margin: '0 0.5rem' }}></i> {flightDest || 'PARIS'}</div>
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, marginTop: '0.5rem', borderTop: '2px dashed #000', paddingTop: '0.5rem' }}>
                    {flightDate} {flightTripType === 'IDA_VUELTA' ? ` / ${flightReturnDate}` : ''} | {flightPassengers} PAX | {flightClass === 'BUSINESS' ? 'BIZ' : 'ECO'}
                  </div>
                </div>
                
                <h3 style={{ fontSize: '1.5rem', margin: '1rem 0 0 0', fontWeight: 900, textTransform: 'uppercase', background: '#000', color: '#FFF', display: 'inline-block', padding: '0.25rem 0.5rem' }}>DEPARTURE</h3>
                
                {[
                  { id: 1, start: '06:15', end: '09:00', dur: '2H 45M', stops: 'DIRECT', price: flightClass === 'BUSINESS' ? 320 : 85 },
                  { id: 2, start: '08:30', end: '11:15', dur: '2H 45M', stops: 'DIRECT', price: flightClass === 'BUSINESS' ? 350 : 120 },
                  { id: 3, start: '10:00', end: '13:30', dur: '3H 30M', stops: '1 STOP', price: flightClass === 'BUSINESS' ? 290 : 75 },
                  { id: 4, start: '14:00', end: '16:45', dur: '2H 45M', stops: 'DIRECT', price: flightClass === 'BUSINESS' ? 380 : 160 },
                  { id: 5, start: '18:20', end: '21:05', dur: '2H 45M', stops: 'DIRECT', price: flightClass === 'BUSINESS' ? 340 : 110 },
                  { id: 6, start: '21:45', end: '00:30', dur: '2H 45M', stops: 'DIRECT', price: flightClass === 'BUSINESS' ? 280 : 65 },
                ].map(f => (
                  <div key={f.id} style={{ background: '#FFF', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', border: '4px solid #000', boxShadow: '6px 6px 0px #000' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <div style={{ fontWeight: 900, fontSize: '1.8rem', lineHeight: 1 }}>{f.start}</div>
                          <div style={{ fontSize: '1rem', fontWeight: 800, color: '#6B7280' }}>{flightOrigin.substring(0, 3).toUpperCase()}</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '60px' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>{f.dur}</span>
                          <div style={{ height: '4px', width: '100%', background: '#000', position: 'relative', margin: '4px 0' }}><i className="fas fa-plane" style={{ position: 'absolute', right: '-8px', top: '-7px', fontSize: '1rem', color: '#000' }}></i></div>
                          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: f.stops === 'DIRECT' ? '#000' : '#DC2626' }}>{f.stops}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <div style={{ fontWeight: 900, fontSize: '1.8rem', lineHeight: 1 }}>{f.end}</div>
                          <div style={{ fontSize: '1rem', fontWeight: 800, color: '#6B7280' }}>{(flightDest || 'PAR').substring(0, 3).toUpperCase()}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: '2rem', fontWeight: 900, background: '#D9F99D', padding: '0.2rem 0.5rem', border: '2px solid #000' }}>{f.price + (flightBaggageAdded ? 35 : 0)}€</div>
                    </div>
                    <button onClick={() => setFlightSearchStep('CHECKOUT')} style={{ background: '#000', color: '#FFF', border: 'none', padding: '1rem', fontWeight: 900, fontSize: '1.2rem', textTransform: 'uppercase', cursor: 'pointer', letterSpacing: '1px' }}>SELECT FLIGHT</button>
                  </div>
                ))}
              </div>
            )}

            {flightTab === 'SEARCH' && flightSearchStep === 'CHECKOUT' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <button onClick={() => setFlightSearchStep('RESULTS')} style={{ background: 'none', border: 'none', color: '#000', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0', fontSize: '1.2rem', fontWeight: 900, textTransform: 'uppercase' }}>
                  <i className="fas fa-arrow-left"></i> CHANGE FLIGHT
                </button>
                <div style={{ background: '#FFF', padding: '1.5rem', border: '4px solid #000', boxShadow: '6px 6px 0px #000' }}>
                  <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem', fontWeight: 900, textTransform: 'uppercase', borderBottom: '4px solid #000', paddingBottom: '0.5rem' }}>ORDER SUMMARY</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontWeight: 800, fontSize: '1.1rem' }}>
                    <span>BASE FARE</span>
                    <span>120€</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontWeight: 800, fontSize: '1.1rem' }}>
                    <span>TAXES</span>
                    <span>15€</span>
                  </div>
                  {flightBaggageAdded && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontWeight: 800, fontSize: '1.1rem' }}>
                      <span>BAGGAGE</span>
                      <span>35€</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '1.8rem', background: '#D9F99D', padding: '1rem', border: '4px solid #000', marginTop: '1rem' }}>
                    <span>TOTAL</span>
                    <span>{135 + (flightBaggageAdded ? 35 : 0)}€</span>
                  </div>
                </div>

                <div style={{ background: '#FFF', padding: '1.5rem', border: '4px solid #000', boxShadow: '6px 6px 0px #000' }}>
                  <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem', fontWeight: 900, textTransform: 'uppercase' }}>PAYMENT</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div onClick={() => setFlightPaymentMethod('CARD')} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', border: '4px solid #000', background: flightPaymentMethod === 'CARD' ? '#A5B4FC' : '#FFF', cursor: 'pointer' }}>
                      <i className="fas fa-credit-card" style={{ fontSize: '2rem' }}></i>
                      <div>
                        <div style={{ fontWeight: 900, fontSize: '1.2rem', textTransform: 'uppercase' }}>CREDIT CARD</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>VISA / MC / AMEX</div>
                      </div>
                    </div>
                    <div onClick={() => setFlightPaymentMethod('PAYPAL')} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', border: '4px solid #000', background: flightPaymentMethod === 'PAYPAL' ? '#FCA5A5' : '#FFF', cursor: 'pointer' }}>
                      <i className="fab fa-paypal" style={{ fontSize: '2rem' }}></i>
                      <div>
                        <div style={{ fontWeight: 900, fontSize: '1.2rem', textTransform: 'uppercase' }}>PAYPAL</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>SECURE CHECKOUT</div>
                      </div>
                    </div>
                  </div>
                </div>

                <button onClick={() => { setFlightBooked(true); setTimeout(() => handleFlightObjectiveCheck(), 100); }} style={{ padding: '1.5rem', background: '#000', color: '#FFF', border: 'none', fontSize: '1.8rem', fontWeight: 900, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', boxShadow: '6px 6px 0px #A5B4FC', letterSpacing: '1px' }}>
                  <i className="fas fa-lock"></i> PAY SECURELY
                </button>
              </div>
            )}

            {flightTab === 'PROFILE' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ background: '#FCA5A5', border: '4px solid #000', padding: '1.5rem', color: '#000', boxShadow: '6px 6px 0px #000' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '1rem', fontWeight: 900, textTransform: 'uppercase', background: '#000', color: '#FFF', display: 'inline-block', padding: '0.2rem 0.5rem' }}>VIP MEMBER</div>
                      <div style={{ fontSize: '2rem', fontWeight: 900, marginTop: '0.5rem', textTransform: 'uppercase' }}>DEMO USER</div>
                    </div>
                    <i className="fas fa-certificate" style={{ fontSize: '3rem' }}></i>
                  </div>
                  <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '3rem', fontWeight: 900, lineHeight: 1 }}>45,200</div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, textTransform: 'uppercase' }}>AVAILABLE MILES</div>
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 900, border: '2px solid #000', padding: '0.2rem 0.5rem' }}>ID: 991-X</div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {[
                    { icon: 'fa-id-card', title: 'DOCUMENTS', desc: 'PASSPORT & VISAS', bg: '#D9F99D' },
                    { icon: 'fa-sliders', title: 'PREFERENCES', desc: 'SEATS & MEALS', bg: '#A5B4FC' },
                    { icon: 'fa-credit-card', title: 'PAYMENT', desc: 'SAVED CARDS', bg: '#FFF' },
                    { icon: 'fa-shield-halved', title: 'SECURITY', desc: 'PASSWORDS & 2FA', bg: '#FFF' },
                    { icon: 'fa-headset', title: 'SUPPORT', desc: 'HELP CENTER', bg: '#FFF' }
                  ].map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', background: item.bg, border: '4px solid #000', boxShadow: '4px 4px 0px #000', cursor: 'pointer' }}>
                      <i className={`fas ${item.icon}`} style={{ fontSize: '2rem' }}></i>
                      <div style={{ flex: 1, marginLeft: '0.5rem' }}>
                        <div style={{ fontWeight: 900, fontSize: '1.2rem', textTransform: 'uppercase' }}>{item.title}</div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 800 }}>{item.desc}</div>
                      </div>
                      <i className="fas fa-arrow-right" style={{ fontSize: '1.5rem' }}></i>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {flightTab === 'BOARDING' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h3 style={{ margin: '0', fontSize: '2rem', fontWeight: 900, textTransform: 'uppercase', background: '#000', color: '#FFF', display: 'inline-block', padding: '0.25rem 0.5rem' }}>MY TRIPS</h3>
                
                <div style={{ background: '#FFF', border: '4px solid #000', padding: '1.5rem', boxShadow: '8px 8px 0px #000', position: 'relative' }}>
                  
                  <div style={{ display: 'inline-block', background: '#D9F99D', border: '4px solid #000', color: '#000', fontSize: '1rem', fontWeight: 900, padding: '0.3rem 0.6rem', textTransform: 'uppercase', marginBottom: '1.5rem' }}>UPCOMING FLIGHT</div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <div style={{ fontSize: '3rem', fontWeight: 900, lineHeight: 1 }}>{flightOrigin.substring(0, 3).toUpperCase()}</div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, marginTop: '4px' }}>MADRID</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, padding: '0 1rem' }}>
                      <i className="fas fa-plane" style={{ fontSize: '2rem', marginBottom: '8px' }}></i>
                      <div style={{ width: '100%', borderBottom: '4px dashed #000' }}></div>
                      <span style={{ fontSize: '1rem', fontWeight: 900, marginTop: '8px' }}>DIRECT</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <div style={{ fontSize: '3rem', fontWeight: 900, lineHeight: 1 }}>{(flightDest || 'PAR').substring(0, 3).toUpperCase()}</div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, marginTop: '4px' }}>{flightDest ? flightDest.split(',')[0].toUpperCase() : 'PARIS'}</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0', background: '#A5B4FC', border: '4px solid #000', marginBottom: '2rem' }}>
                    <div style={{ padding: '1rem', borderBottom: '4px solid #000', borderRight: '4px solid #000' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 900, textTransform: 'uppercase' }}>PASSENGER</div>
                      <div style={{ fontWeight: 900, fontSize: '1.2rem' }}>DEMO USER</div>
                    </div>
                    <div style={{ padding: '1rem', borderBottom: '4px solid #000' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 900, textTransform: 'uppercase' }}>DATE</div>
                      <div style={{ fontWeight: 900, fontSize: '1.2rem' }}>{flightDate}</div>
                    </div>
                    <div style={{ padding: '1rem', borderRight: '4px solid #000' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 900, textTransform: 'uppercase' }}>FLIGHT</div>
                      <div style={{ fontWeight: 900, fontSize: '1.2rem' }}>BRU-404</div>
                    </div>
                    <div style={{ padding: '1rem' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 900, textTransform: 'uppercase' }}>SEAT</div>
                      <div style={{ fontWeight: 900, fontSize: '1.2rem' }}>{flightClass === 'BUSINESS' ? '1A' : '12B'}</div>
                    </div>
                  </div>

                  <div style={{ background: '#FFF', padding: '1rem', border: '4px solid #000', display: 'flex', justifyContent: 'center' }}>
                    <i className="fas fa-qrcode" style={{ fontSize: '8rem', color: '#000' }}></i>
                  </div>
                  
                  {setTimeout(() => handleFlightObjectiveCheck(), 100) as unknown as null}
                </div>
              </div>
            )}

            {flightTab === 'EXPLORE' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h3 style={{ margin: '0', fontSize: '2rem', fontWeight: 900, textTransform: 'uppercase', background: '#000', color: '#FFF', display: 'inline-block', padding: '0.25rem 0.5rem' }}>EXPLORE</h3>
                
                <div style={{ border: '4px solid #000', position: 'relative', overflow: 'hidden', height: '250px', boxShadow: '6px 6px 0px #000', background: '#FCA5A5' }}>
                  <img src="https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=800&auto=format&fit=crop" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'contrast(1.2)' }} alt="Destinos" />
                  <div style={{ position: 'absolute', top: '10px', left: '10px', background: '#D9F99D', border: '4px solid #000', padding: '0.25rem 0.5rem', fontWeight: 900, textTransform: 'uppercase' }}>TOP DESTINATION</div>
                  <div style={{ position: 'absolute', bottom: '10px', right: '10px', background: '#000', color: '#FFF', padding: '0.5rem 1rem', fontSize: '2rem', fontWeight: 900, textTransform: 'uppercase' }}>TOKYO</div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
                    <h4 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, textTransform: 'uppercase' }}>LAST MINUTE DEALS</h4>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {[
                      { dest: 'LONDON (LHR)', oldPrice: 195, newPrice: 150, discount: '23% OFF', date: 'TOMORROW', img: 'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?q=80&w=400&auto=format&fit=crop' },
                      { dest: 'ROME (FCO)', oldPrice: 220, newPrice: 165, discount: '25% OFF', date: 'THIS WKND', img: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=400&auto=format&fit=crop' },
                      { dest: 'BERLIN (BER)', oldPrice: 150, newPrice: 90, discount: '40% OFF', date: 'NEXT TUE', img: 'https://images.unsplash.com/photo-1560969184-10fe8719e047?q=80&w=400&auto=format&fit=crop' },
                      { dest: 'NEW YORK (JFK)', oldPrice: 650, newPrice: 420, discount: '35% OFF', date: 'NEXT WK', img: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=400&auto=format&fit=crop' },
                      { dest: 'DUBAI (DXB)', oldPrice: 580, newPrice: 480, discount: '17% OFF', date: 'IN 3 DAYS', img: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=400&auto=format&fit=crop' },
                      { dest: 'BALI (DPS)', oldPrice: 850, newPrice: 620, discount: '27% OFF', date: 'SATURDAY', img: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=400&auto=format&fit=crop' }
                    ].map((offer, i) => (
                      <div key={i} style={{ display: 'flex', background: '#FFF', border: '4px solid #000', boxShadow: '6px 6px 0px #000', cursor: 'pointer' }} onClick={() => { setFlightDest(offer.dest); setFlightTab('SEARCH'); setFlightSearchStep('FORM'); }}>
                        <div style={{ width: '120px', borderRight: '4px solid #000' }}>
                          <img src={offer.img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={offer.dest} />
                        </div>
                        <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ fontWeight: 900, fontSize: '1.2rem', textTransform: 'uppercase' }}>{offer.dest}</div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 800, marginTop: '0.2rem', background: '#000', color: '#FFF', display: 'inline-block', padding: '0.1rem 0.4rem' }}>
                              {offer.date}
                            </div>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontSize: '1rem', fontWeight: 800, textDecoration: 'line-through', color: '#6B7280' }}>{offer.oldPrice}€</span>
                              <span style={{ fontSize: '1.5rem', fontWeight: 900 }}>{offer.newPrice}€</span>
                            </div>
                            <div style={{ background: '#FCA5A5', border: '2px solid #000', fontWeight: 900, padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}>
                              {offer.discount}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {flightTab !== 'SEARCH' && flightTab !== 'BOARDING' && flightTab !== 'PROFILE' && flightTab !== 'EXPLORE' && (
              <div style={{ border: '4px solid #000', background: '#000', color: '#FFF', padding: '3rem 1.5rem', textAlign: 'center', boxShadow: '6px 6px 0px #FCA5A5' }}>
                <h2 style={{ fontSize: '4rem', fontWeight: 900, margin: 0, lineHeight: 1 }}>404</h2>
                <p style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', margin: '1rem 0 0 0' }}>SECTION NOT FOUND</p>
              </div>
            )}
          </div>

          <div style={{ flexShrink: 0, height: '80px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: '0', borderTop: '4px solid #000', background: '#000' }}>
            <button onClick={() => setFlightTab('SEARCH')} style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: flightTab === 'SEARCH' ? '#FFF' : '#000', color: flightTab === 'SEARCH' ? '#000' : '#FFF', border: 'none', borderRight: '4px solid #000', fontSize: '1.2rem', cursor: 'pointer' }}><i className="fas fa-search"></i><span style={{ fontSize: '0.6rem', fontWeight: 900, marginTop: '4px' }}>SEARCH</span></button>
            <button onClick={() => setFlightTab('EXPLORE')} style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: flightTab === 'EXPLORE' ? '#FFF' : '#000', color: flightTab === 'EXPLORE' ? '#000' : '#FFF', border: 'none', borderRight: '4px solid #000', fontSize: '1.2rem', cursor: 'pointer' }}><i className="fas fa-compass"></i><span style={{ fontSize: '0.6rem', fontWeight: 900, marginTop: '4px' }}>EXPLORE</span></button>
            <button onClick={() => setFlightTab('BOARDING')} style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: flightTab === 'BOARDING' ? '#FFF' : '#000', color: flightTab === 'BOARDING' ? '#000' : '#FFF', border: 'none', borderRight: '4px solid #000', fontSize: '1.2rem', cursor: 'pointer' }}><i className="fas fa-ticket-simple"></i><span style={{ fontSize: '0.6rem', fontWeight: 900, marginTop: '4px' }}>TRIPS</span></button>
            <button onClick={() => setFlightTab('NOTIFICATIONS')} style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: flightTab === 'NOTIFICATIONS' ? '#FFF' : '#000', color: flightTab === 'NOTIFICATIONS' ? '#000' : '#FFF', border: 'none', borderRight: '4px solid #000', fontSize: '1.2rem', cursor: 'pointer' }}><i className="fas fa-bell"></i><span style={{ fontSize: '0.6rem', fontWeight: 900, marginTop: '4px' }}>ALERTS</span></button>
            <button onClick={() => setFlightTab('PROFILE')} style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: flightTab === 'PROFILE' ? '#FFF' : '#000', color: flightTab === 'PROFILE' ? '#000' : '#FFF', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}><i className="fas fa-user"></i><span style={{ fontSize: '0.6rem', fontWeight: 900, marginTop: '4px' }}>PROFILE</span></button>
          </div>
        </div>
      );
    }

    
    return null;
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
            '--theme-accent-rgb': screen.themeColors.accentColor === '#0A5C36' ? '10, 92, 54' : '234, 88, 12',
            '--theme-accent-hover': screen.themeColors.accentColor === '#0A5C36' ? '#08482A' : '#C2410C',
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
            <div className="screen-status-bar" style={(appState === 'MAIN_MENU' || (screen && screen.themeColors.primaryBg === '#0A5C36')) ? { color: '#FFF' } : {}}>
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
                        onClick={() => {
                          if (num >= 6) {
                            alert('Funcionalidad próximamente disponible');
                          } else {
                            setLevel(num);
                          }
                        }}
                        className={`menu-level-btn ${level === num ? 'active' : ''}`}
                        style={{ opacity: num >= 6 ? 0.5 : 1, cursor: num >= 6 ? 'not-allowed' : 'pointer' }}
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
                      const nextIdxs = peekNextIndices(level);
                      setPendingVerIndex(nextIdxs.ver);
                      setPendingObjIndex(nextIdxs.obj);
                      fetchForObjective(level, nextIdxs.ver, nextIdxs.obj).then(() => {
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
                  onClick={() => fetchScreen(level, currentVerIndex, currentObjIndex)}
                  style={{ background: '#C53030', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Reintentar Conexión
                </button>
              </div>
            )}

            {!loading && !error && screen && (
              screen.appTemplate === 'DELIVERY' ? (
                renderDeliveryApp()
              ) : screen.appTemplate === 'BANKING' ? (
                renderBankingApp()
              ) : screen.appTemplate === 'CLOCK' ? (
                renderClockApp()
              ) : screen.appTemplate === 'FLIGHTS' ? (
                renderFlightApp()
              ) : (
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

              </>
              )
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
                      {pendingScreen && !objectiveLoading && (
                        <div className="objective-meta-header">
                          <span className="objective-level-badge">Nivel {pendingScreen.complexityLevel}</span>
                          <span className="objective-template">{pendingScreen.appTemplate}</span>
                        </div>
                      )}

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
                          <p className="objective-text">
                            {pendingScreen.missionText.replace(/\.$/, '')}
                          </p>
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

            {/* Persistent Floating Assistive "Ver Objetivo" Button inside phone - FOR ALL APPS */}
            {!showObjective && !success && screen && (
              <>
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

                {/* DEV ONLY: Botón temporal para rotar interfaz */}
                <button 
                  className="floating-objective-btn"
                  style={{ top: '60%', background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' }}
                  onClick={() => {
                    const numVersions = getVersionsCountForLevel(level);
                    const nextVer = (currentVerIndex + 1) % numVersions;
                    fetchScreen(level, nextVer, currentObjIndex);
                  }}
                  title="Rotar Interfaz (Dev)"
                  aria-label="Rotar Interfaz"
                >
                  <i className="fas fa-sync-alt"></i>
                  <span>Rotar Interfaz</span>
                </button>
              </>
            )}

            <div className="home-indicator"></div>
          </div>
        </div>
      </div>

    </div>
  );
}
