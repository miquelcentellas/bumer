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



  // Decoupled clean interface count per level
  const getInterfaceCountForLevel = (lv: number): number => {
    if (lv === 1) return 3; // 3 layouts (ver: 1, 2, 3)
    if (lv === 2) return 2; // 2 landing palettes
    if (lv === 3 || lv === 4) return 2; // 2 delivery themes (Orange vs Green)
    if (lv === 5 || lv === 6) return 4; // 4 banking/ecommerce variations
    return 2; // default fallback for other levels
  };

  // Get the next interface index for a level, complying strictly with rotation rules
  const getNextInterfaceIndex = (lv: number): number => {
    const n = getInterfaceCountForLevel(lv);
    
    // Read last played index from localStorage
    let lastPlayedMap: Record<number, number> = {};
    try {
      const savedLast = localStorage.getItem('bumer_last_played_interface');
      if (savedLast) lastPlayedMap = JSON.parse(savedLast);
    } catch (e) {
      console.error(e);
    }
    
    const lastPlayed = lastPlayedMap[lv] ?? -1;
    
    if (lastPlayed === -1) {
      // First time playing: pick 0
      return 0;
    }
    
    if (n === 2) {
      // If there are exactly 2 interfaces, they must strictly alternate: 0, 1, 0, 1...
      return lastPlayed === 0 ? 1 : 0;
    } else {
      // If there are 3 or more interfaces, pick randomly but ALWAYS different from the last one
      const available = [];
      for (let i = 0; i < n; i++) {
        if (i !== lastPlayed) {
          available.push(i);
        }
      }
      const randIdx = Math.floor(Math.random() * available.length);
      return available[randIdx];
    }
  };

  // Peek at the next version index without committing it
  const peekVersionIndex = (lv: number): number => {
    return getNextInterfaceIndex(lv);
  };

  // Commit the version index by updating lastPlayed in localStorage
  const commitVersionIndex = (lv: number): number => {
    const nextIdx = getNextInterfaceIndex(lv);
    
    let lastPlayedMap: Record<number, number> = {};
    try {
      const savedLast = localStorage.getItem('bumer_last_played_interface');
      if (savedLast) lastPlayedMap = JSON.parse(savedLast);
    } catch (e) {
      console.error(e);
    }
    
    lastPlayedMap[lv] = nextIdx;
    
    try {
      localStorage.setItem('bumer_last_played_interface', JSON.stringify(lastPlayedMap));
    } catch (e) {
      console.error(e);
    }
    
    return nextIdx;
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
    setSelectedDeliveryProduct(null);
    setDeliveryCart([]);
    setShowDeliveryCart(false);
    setDeliveryError(null);
    setDeliveryCustomizations({});
    setDeliverySearchQuery('');
    setSelectedDeliveryCategory('');
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
    setSelectedDeliveryProduct(null);
    setDeliveryCart([]);
    setShowDeliveryCart(false);
    setDeliveryError(null);
    setDeliveryCustomizations({});
    setDeliverySearchQuery('');
    setSelectedDeliveryCategory('');
    // Auto-fetch with the current level so the objective text appears immediately
    fetchForObjective(level);
  };

  // Handler called when user taps "¡Entendido, Empezar!"
  const handleStartFromObjective = () => {
    if (pendingScreen) {
      if (pendingScreen !== screen) {
        // Commit the version since the user is now starting the level!
        commitVersionIndex(pendingScreen.complexityLevel);

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

          {/* BúmerFood Premium Hero Banner */}
          {isGreenTheme && (
            <div className="bumerfood-hero-banner">
              <div className="hero-text-col">
                <span className="hero-tagline">Comidas Irresistiblemente Sabrosas</span>
                <h2 className="hero-title">HECHO FRESCO • SERVIDO CALIENTE</h2>
                <button className="hero-cta-btn">Pedir Ahora 🔥</button>
              </div>
              
              <div className="hero-discount-ribbon">
                <span className="ribbon-text-up">Hasta el</span>
                <span className="ribbon-text-percent">40%</span>
              </div>

              <div className="hero-img-col">
                <img src="/delivery/asian_wings_bowl.png" alt="Plato delicioso" className="hero-food-image" />
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
              screen.appTemplate === 'DELIVERY' ? (
                renderDeliveryApp()
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
