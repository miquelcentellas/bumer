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

  // Independent rotation state tracking
  const [currentVerIndex, setCurrentVerIndex] = useState<number>(0);
  const [currentObjIndex, setCurrentObjIndex] = useState<number>(0);
  const [pendingVerIndex, setPendingVerIndex] = useState<number>(0);
  const [pendingObjIndex, setPendingObjIndex] = useState<number>(0);

  // Decoupled clean interface count per level
  const getVersionsCountForLevel = (lv: number): number => {
    if (lv === 1) return 3; // 3 visual styles
    if (lv === 2) return 2; // 2 palettes
    if (lv === 3 || lv === 4) return 2; // 2 delivery themes
    if (lv === 5) return 2; // 2 E-Commerce palettes
    if (lv === 6) return 2; // 2 Banking palettes
    return 2;
  };

  const getObjectivesCountForLevel = (lv: number): number => {
    if (lv === 1) return 3; // 3 objectives
    if (lv === 2) return 2; // 2 objectives
    if (lv === 3 || lv === 4) return 12; // 12 target food items
    if (lv === 5) return 2; // 2 E-Commerce objectives
    if (lv === 6) return 4; // 4 Banking objectives: 2 transfers + block card + Bizum
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

        {/* Persistent Floating Assistive "Ver Objetivo" Button inside custom view */}
        {!showObjective && !success && (
          <button 
            className="floating-objective-btn"
            onClick={() => {
              setPendingScreen(screen);
              setShowObjective(true);
            }}
            title="Ver objetivo de la misión"
            aria-label="Ver objetivo de la misión"
            style={{ bottom: '80px', right: '16px' }}
          >
            <i className="fas fa-bullseye"></i>
            <span>Ver Objetivo</span>
          </button>
        )}
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
      
      // Check if active mission objective is blocking the card
      if (screen?.missionText.includes('Bloquea temporalmente')) {
        setSuccess(true);
      }
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
                <button onClick={() => setBankAlert(null)} style={{ padding: '0.65rem 1.5rem', backgroundColor: 'var(--theme-accent)', border: 'none', borderRadius: '10px', color: '#FFFFFF', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', fontFamily: 'Bree Serif, Roboto, sans-serif' }}>Entendido</button>
              </div>
            </div>
          </div>
        )}

        {/* Persistent Floating Assistive "Ver Objetivo" Button inside custom view */}
        {!showObjective && !success && (
          <button 
            className="floating-objective-btn"
            onClick={() => {
              setPendingScreen(screen);
              setShowObjective(true);
            }}
            title="Ver objetivo de la misión"
            aria-label="Ver objetivo de la misión"
            style={{ bottom: '80px', right: '16px' }}
          >
            <i className="fas fa-bullseye"></i>
            <span>Ver Objetivo</span>
          </button>
        )}
      </div>
    );
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

            <div className="home-indicator"></div>
          </div>
        </div>
      </div>

    </div>
  );
}
