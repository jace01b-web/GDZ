(function() {
    // =========================================================
    // 1. STATE & CONFIGURATION MANAGEMENT
    // =========================================================
    const STORAGE_KEY = 'gd_wave_premium_config_v5';
    
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Default values
    let config = {
        baseSpeed: 1.0,
        focusSpeed: 0.5,
        timeFreeze: false,
        fpsUnlocker: false, 
        antiLag: true,     
        loopWeek: false,    
        zoom: 1.0,
        rotation: 0,
        invertX: false,
        invertY: false,
        brightness: 100,
        contrast: 100,
        saturation: 100,
        hue: 0,
        blur: 0,
        invertColors: 0,
        grayscale: 0,
        sepia: 0,
        rainbowMode: false,
        rainbowSpeed: 2.0,
        showAimLine: false,
        showGrid: false,
        gridSize: 50,
        showCrosshair: false,
        crosshairType: 'cross', 
        crosshairColor: '#00ffcc',
        realCursor: 'default',
        autoClickerActive: false,
        autoClickerCPS: 15,
        jitterClick: false, 
        jitterIntensity: 3,
        ghostMode: 100, 
        earthquake: false,
        earthquakeIntensity: 5,
        deepFried: false,
        flashlight: false,
        flashlightRadius: 80,
        cinematic: false,
        vignette: false,
        menuOpacity: 0.85,
        menuTheme: '#00ffcc',
        chromaTheme: true, 
        tabPosition: 'left', 
        toggleKey: 'm',
        macroKey: 'c',
        showMobileControls: false, // Defaulted false for PC, overridden automatically for Mobile below
        menuScaleX: 1.0,           // Width Multiplier (Min 0.9, Max 2.5)
        menuScaleY: 1.0,           // Height Multiplier (Min 0.9, Max 2.5)
        dismissedAntiLagWarning: false
    };

    function loadConfig() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) config = { ...config, ...JSON.parse(saved) };
        } catch(e) { console.error("Could not load premium config", e); }
    }
    
    function saveConfig() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
        applyAllVisuals();
    }

    function resetConfig() {
        localStorage.removeItem(STORAGE_KEY);
        location.reload(); 
    }

    loadConfig();

    // =========================================================
    // 2. HIGH-PERFORMANCE ENGINE HIJACK (FPS UNLOCKER & SPEED)
    // =========================================================
    let speedMultiplier = config.baseSpeed;
    let shiftHeld = false;
    let mobileFocusActive = false;
    let mobileMacroActive = false;
    let isTimeSkipping = false; 
    
    const originalPerfNow = performance.now.bind(performance);
    let perfLastReal = originalPerfNow();
    let perfFake = perfLastReal;
    
    performance.now = function() {
        const now = originalPerfNow();
        const dt = now - perfLastReal;
        perfLastReal = now;
        if (!config.timeFreeze) perfFake += (dt * speedMultiplier);
        return perfFake;
    };

    const originalDateNow = Date.now.bind(Date);
    let dateLastReal = originalDateNow();
    let dateFake = dateLastReal;
    
    Date.now = function() {
        const now = originalDateNow();
        const dt = now - dateLastReal;
        dateLastReal = now;
        if (!config.timeFreeze) dateFake += (dt * speedMultiplier);
        return Math.floor(dateFake);
    };

    const originalRAF = window.requestAnimationFrame.bind(window);
    const originalCAF = window.cancelAnimationFrame.bind(window);
    
    let rafs = new Map();
    let rafId = 0;
    const fpsChannel = new MessageChannel();
    
    fpsChannel.port1.onmessage = () => {
        const callbacks = Array.from(rafs.values());
        rafs.clear();
        const now = performance.now();
        callbacks.forEach(cb => cb(now));
    };
    
    window.requestAnimationFrame = function(callback) {
        if (config.fpsUnlocker) {
            rafId++;
            rafs.set(rafId, callback);
            fpsChannel.port2.postMessage(null);
            return rafId;
        }
        return originalRAF(callback);
    };

    window.cancelAnimationFrame = function(id) {
        if (config.fpsUnlocker && rafs.has(id)) {
            rafs.delete(id);
        } else {
            originalCAF(id);
        }
    };

    // =========================================================
    // 3. PREMIUM UI CONSTRUCTION (REDESIGNED + MOBILE SUPPORT)
    // =========================================================
    function buildModMenu() {
        if (document.getElementById('gd-standalone-menu')) return;

        const style = document.createElement('style');
        style.innerHTML = `
            :root {
                --theme-color: ${config.menuTheme};
                --bg-color: rgba(18, 18, 24, ${config.menuOpacity});
                --panel-border: rgba(255, 255, 255, 0.06);
                --text-glow: 0 0 12px var(--theme-color);
                --font-main: 'Inter', system-ui, -apple-system, sans-serif;
            }
            
            #gd-standalone-menu {
                position: fixed; 
                top: 10vh; 
                left: 10vw; 
                width: 520px; 
                height: 600px;
                max-width: 95vw;
                max-height: 95vh;
                background: var(--bg-color); 
                backdrop-filter: blur(24px) saturate(140%); -webkit-backdrop-filter: blur(24px) saturate(140%);
                border: 1px solid var(--panel-border); 
                border-radius: 14px;
                color: #f1f5f9; 
                font-family: var(--font-main);
                z-index: 9999999; 
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
                user-select: none; 
                display: flex; 
                flex-direction: column;
                will-change: transform, opacity;
                opacity: 0;
                transform-origin: center;
                transform: scale(0.95);
                transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease, width 0.3s, height 0.3s;
            }
            
            #gd-standalone-menu.menu-visible {
                opacity: 1;
                transform: scale(1);
                pointer-events: auto;
            }
            
            #gd-standalone-menu.menu-hidden {
                opacity: 0 !important;
                transform: scale(0.95) !important;
                pointer-events: none !important;
            }

            #gd-mobile-toggle {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 45px;
                height: 45px;
                background: var(--bg-color);
                backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
                border: 2px solid var(--theme-color);
                border-radius: 50%;
                z-index: 10000000;
                display: flex;
                justify-content: center;
                align-items: center;
                cursor: pointer;
                box-shadow: 0 4px 15px rgba(0,0,0,0.5), var(--text-glow);
                color: var(--theme-color);
                font-size: 22px;
                user-select: none;
                touch-action: none;
                transition: transform 0.1s, background 0.3s;
            }
            #gd-mobile-toggle:active {
                transform: scale(0.9);
                background: rgba(255,255,255,0.1);
            }

            #gd-mobile-controls {
                position: fixed;
                bottom: 80px; 
                right: 20px;
                display: none; 
                flex-direction: column;
                gap: 15px;
                z-index: 10000000;
            }
            .gd-mc-btn {
                width: 45px; height: 45px;
                background: var(--bg-color);
                backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
                border: 2px solid var(--theme-color);
                border-radius: 50%;
                color: #fff;
                display: flex; justify-content: center; align-items: center;
                font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.5);
                user-select: none; touch-action: manipulation;
                transition: all 0.2s ease;
                cursor: pointer;
            }
            .gd-mc-btn.active {
                background: var(--theme-color);
                color: #121218;
                box-shadow: var(--text-glow);
                transform: scale(1.05);
            }
            
            .gd-header {
                display: flex; justify-content: space-between; align-items: center;
                background: rgba(0, 0, 0, 0.2);
                padding: 14px 20px; cursor: move; 
                border-top-left-radius: 14px; border-top-right-radius: 14px;
                border-bottom: 1px solid var(--panel-border); flex-shrink: 0;
                touch-action: none;
            }
            .gd-title { font-weight: 800; font-size: 14px; color: #fff; letter-spacing: 2px; text-shadow: var(--text-glow); transition: text-shadow 0.3s; }
            .gd-fps { font-family: monospace; color: #fff; font-size: 11px; font-weight: bold; background: rgba(0, 0, 0, 0.5); padding: 4px 8px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); }
            
            .gd-content-wrapper { display: flex; flex: 1; overflow: hidden; position: relative; min-height: 0; }
            .gd-tabs { display: flex; flex-direction: column; background: rgba(0, 0, 0, 0.15); flex-shrink: 0; transition: all 0.4s ease; border-right: 1px solid var(--panel-border); width: 120px; }
            
            .sidebar-header { padding: 16px 10px 12px; text-align: center; border-bottom: 1px solid var(--panel-border); margin-bottom: 8px; }
            .sidebar-title { color: var(--theme-color); font-weight: 900; font-size: 14px; letter-spacing: 2px; text-shadow: var(--text-glow); }
            .sidebar-subtitle { color: #64748b; font-size: 9px; font-weight: 600; text-transform: uppercase; margin-top: 4px; letter-spacing: 1px; }
            .sidebar-footer { margin-top: auto; padding: 16px 10px; text-align: center; border-top: 1px solid var(--panel-border); background: rgba(0,0,0,0.1); }
            
            .status-dot { width: 8px; height: 8px; background: #10b981; border-radius: 50%; display: inline-block; box-shadow: 0 0 10px #10b981; animation: pulse 2s infinite; }
            .status-text { color: #94a3b8; font-size: 9px; font-weight: 700; margin-top: 6px; letter-spacing: 1px; text-transform: uppercase; }
            @keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }

            .pos-top { flex-direction: column; }
            .pos-top .gd-tabs { flex-direction: row; border-bottom: 1px solid var(--panel-border); border-right: none; width: 100%; height: auto; overflow-x: auto; -webkit-overflow-scrolling: touch; }
            .pos-top .sidebar-header, .pos-top .sidebar-footer { display: none; }
            .pos-top .gd-tab.active { border-bottom: 2px solid var(--theme-color); background: rgba(255,255,255,0.03); border-right: none; }
            
            .gd-tab { display: flex; align-items: center; justify-content: flex-start; padding: 12px 16px; font-size: 11px; font-weight: 600; cursor: pointer; color: #94a3b8; transition: all 0.2s ease; border-right: 2px solid transparent; white-space: nowrap; }
            .gd-tab:hover { color: #f8fafc; background: rgba(255,255,255,0.03); }
            .gd-tab.active { color: #fff; background: rgba(255,255,255,0.05); border-right: 2px solid var(--theme-color); text-shadow: 0 0 8px rgba(255,255,255,0.2); }
            
            .gd-body { 
                flex: 1; padding: 16px; overflow-y: auto; overflow-x: hidden; 
                display: flex; flex-direction: column; gap: 20px; 
                scroll-behavior: smooth; -webkit-overflow-scrolling: touch; 
                touch-action: auto; overscroll-behavior: auto; min-height: 0;
            }
            .gd-body::-webkit-scrollbar { width: 4px; height: 4px; }
            .gd-body::-webkit-scrollbar-track { background: transparent; }
            .gd-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
            .gd-body::-webkit-scrollbar-thumb:hover { background: var(--theme-color); }
            
            .tab-content { display: none; flex-direction: column; gap: 16px; opacity: 0; transform: translateY(10px); transition: opacity 0.3s ease, transform 0.3s ease; }
            .tab-content.active { display: flex; opacity: 1; transform: translateY(0px); }
            
            .section-title { font-size: 10px; text-transform: uppercase; color: var(--theme-color); font-weight: 800; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 6px; letter-spacing: 1px; opacity: 0.9; }
            
            .mod-row { display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; }
            .mod-label { font-size: 12px; font-weight: 500; display: flex; flex-direction: column; color: #e2e8f0; line-height: 1.4; flex: 1; min-width: 120px; }
            .mod-subtext { font-size: 10px; color: #64748b; font-weight: 400; margin-top: 2px; }
            
            .warning-box { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); color: #fca5a5; padding: 10px 12px; border-radius: 8px; font-size: 11px; font-weight: 500; display: flex; align-items: flex-start; gap: 10px; line-height: 1.4; }
            
            .switch { position: relative; display: inline-block; width: 40px; height: 22px; flex-shrink: 0; }
            .switch input { opacity: 0; width: 0; height: 0; }
            .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(255,255,255,0.1); transition: 0.3s; border-radius: 22px; }
            .slider:before { position: absolute; content: ""; height: 16px; width: 16px; left: 3px; bottom: 3px; background-color: #fff; transition: 0.3s; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3); }
            input:checked + .slider { background-color: var(--theme-color); }
            input:checked + .slider:before { transform: translateX(18px); }
            
            .range-container { display: flex; flex-direction: column; gap: 8px; width: 100%; }
            .range-header { display: flex; justify-content: space-between; font-size: 12px; font-weight: 500; color: #e2e8f0; align-items: center; }
            .range-val-container { display: flex; align-items: center; background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; padding: 2px 6px; transition: all 0.2s; }
            .range-val-container:focus-within { border-color: var(--theme-color); box-shadow: 0 0 0 2px rgba(0, 255, 204, 0.15); background: rgba(0,0,0,0.4); }
            .range-val-input { background: transparent; border: none; color: #fff; font-weight: 600; font-family: monospace; width: 40px; text-align: right; outline: none; font-size: 12px; }
            .range-unit { color: #94a3b8; font-size: 11px; margin-left: 4px; font-weight: 500; }
            
            .gd-range { -webkit-appearance: none; width: 100%; height: 4px; background: rgba(255, 255, 255, 0.1); border-radius: 4px; outline: none; touch-action: pan-x; }
            .gd-range::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%; background: #fff; border: 3px solid var(--theme-color); cursor: pointer; transition: transform 0.1s, box-shadow 0.2s; }
            .gd-range::-webkit-slider-thumb:hover { transform: scale(1.1); box-shadow: var(--text-glow); }

            .gd-select { background: rgba(0,0,0,0.3); color: #fff; border: 1px solid rgba(255,255,255,0.1); padding: 6px 10px; border-radius: 6px; outline: none; cursor: pointer; font-family: inherit; font-size: 11px; font-weight: 500; transition: all 0.2s; max-width: 100%; }
            .gd-select:focus { border-color: var(--theme-color); box-shadow: 0 0 0 2px rgba(0, 255, 204, 0.15); }
            .gd-select option { background: #1a1a24; }

            .gd-btn { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #f8fafc; padding: 8px; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: 600; transition: all 0.2s ease; text-align: center; }
            .gd-btn:hover { background: rgba(255,255,255,0.1); border-color: var(--theme-color); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
            .gd-btn:active { transform: translateY(0); }
            .btn-group { display: flex; gap: 6px; flex-wrap: wrap; }
            .btn-group .gd-btn { flex: 1; min-width: 50px; padding: 6px; font-size: 11px; }

            .gd-footer { background: rgba(0, 0, 0, 0.2); padding: 10px; font-size: 10px; color: #64748b; text-align: center; border-bottom-left-radius: 14px; border-bottom-right-radius: 14px; flex-shrink: 0; cursor: move; border-top: 1px solid var(--panel-border); font-weight: 500; letter-spacing: 0.5px; touch-action: none; }
            
            /* Overlays */
            #gd-aim-line { position: absolute; top: 50%; left: 0; width: 100%; height: 1px; background: var(--theme-color); box-shadow: var(--text-glow); pointer-events: none; z-index: 9999; display: none; }
            #gd-grid-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-image: linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px); background-size: ${config.gridSize}px ${config.gridSize}px; pointer-events: none; z-index: 9998; display: none; }
            #gd-flashlight-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: radial-gradient(circle at 50% 50%, transparent ${config.flashlightRadius}px, rgba(0,0,0,0.98) ${config.flashlightRadius + 50}px); pointer-events: none; z-index: 9998; display: none; }
            #gd-cinematic-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; box-shadow: inset 0 135px 0 #000, inset 0 -135px 0 #000; pointer-events: none; z-index: 9998; display: none; }
            #gd-vignette-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: radial-gradient(circle, transparent 40%, rgba(0,0,0,0.95) 100%); pointer-events: none; z-index: 9998; display: none; }
            
            #gd-crosshair-overlay { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); pointer-events: none; z-index: 10000; display: none; }
            .ch-dot { width: 6px; height: 6px; background: var(--crosshair-color, #00ffcc); border-radius: 50%; box-shadow: 0 0 6px var(--crosshair-color, #00ffcc); }
            .ch-cross { position: relative; width: 20px; height: 20px; }
            .ch-cross::before, .ch-cross::after { content: ''; position: absolute; background: var(--crosshair-color, #00ffcc); box-shadow: 0 0 4px var(--crosshair-color, #00ffcc); }
            .ch-cross::before { top: 9px; left: 0; width: 20px; height: 2px; }
            .ch-cross::after { top: 0; left: 9px; width: 2px; height: 20px; }
            .ch-reticle { width: 16px; height: 16px; border: 2px solid var(--crosshair-color, #00ffcc); border-radius: 50%; box-shadow: 0 0 5px var(--crosshair-color, #00ffcc); position: relative; }
            .ch-reticle::before { content: ''; position: absolute; top: 50%; left: 50%; width: 4px; height: 4px; background: var(--crosshair-color, #00ffcc); border-radius: 50%; transform: translate(-50%, -50%); }

            @media (max-width: 768px) {
                #gd-standalone-menu {
                    width: 340px !important;
                    height: 500px !important;
                }
                .gd-content-wrapper {
                    flex-direction: column !important;
                }
                .gd-tabs {
                    width: 100% !important;
                    height: auto !important;
                    flex-direction: row !important;
                    overflow-x: auto !important;
                    border-right: none !important;
                    border-bottom: 1px solid var(--panel-border) !important;
                }
                .gd-tab {
                    padding: 10px 14px;
                    border-right: none !important;
                    border-bottom: 2px solid transparent;
                }
                .gd-tab.active {
                    border-bottom: 2px solid var(--theme-color) !important;
                    border-right: none !important;
                }
                .sidebar-header, .sidebar-footer {
                    display: none !important;
                }
            }
        `;
        document.head.appendChild(style);

        const menu = document.createElement('div');
        menu.id = 'gd-standalone-menu';
        menu.innerHTML = `
            <div class="gd-header" id="gd-handle">
                <span class="gd-title">WAVE CLIENT <span style="font-size:9px; color:var(--theme-color); opacity:0.6; font-weight:600; margin-left: 8px;">InitialsAndVoices</span></span>
                <span class="gd-fps" id="fps-counter">0 FPS</span>
            </div>
            
            <div class="gd-content-wrapper pos-${config.tabPosition}" id="gd-content-wrapper">
                <div class="gd-tabs">
                    <div class="sidebar-header">
                        <div class="sidebar-title">WAVE</div>
                        <div class="sidebar-subtitle">Premium</div>
                    </div>
                    
                    <div class="gd-tab active" data-target="tab-main">Engine</div>
                    <div class="gd-tab" data-target="tab-visuals">Visuals</div>
                    <div class="gd-tab" data-target="tab-macros">Macros</div>
                    <div class="gd-tab" data-target="tab-training">Assist</div>
                    <div class="gd-tab" data-target="tab-mods">Chaos</div>
                    <div class="gd-tab" data-target="tab-config">Config</div>
                    
                    <div class="sidebar-footer">
                        <div class="status-dot"></div>
                        <div class="status-text">SYSTEM ONLINE</div>
                    </div>
                </div>

                <div class="gd-body">
                    <div id="gd-anti-lag-warning" class="warning-box" style="margin-bottom: 15px; display: none; align-items: center; justify-content: space-between; flex-shrink: 0;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 16px;">⚠</span> 
                            <span><b>Warning:</b> Anti-lag mode disables a lot of mods! Canvas Transforms and Filters are forcefully disabled.</span>
                        </div>
                        <button class="gd-btn" id="btn-dismiss-warning" style="background: #ef4444; color: #fff; opacity: 0.5; cursor: not-allowed; pointer-events: none; text-align: center; white-space: nowrap; margin-left:10px;" disabled>Dismiss (10)</button>
                    </div>

                    <div class="tab-content active" id="tab-main">
                        <div class="section-title">Engine Speeds</div>
                        ${createSlider('Base Engine Clock Speed', 'baseSpeed', 0.05, 5.0, 0.05, 'x')}
                        ${createSlider('Focus Speed Multiplier (Shift)', 'focusSpeed', 0.05, 1.0, 0.05, 'x')}
                        ${createToggle('Complete Time Freeze', 'timeFreeze', 'Halts all game physics instantly')}
                        
                        <div class="section-title">Engine Skips & Automation Loops</div>
                        <div class="gd-btn" id="btn-timeskip" style="border-color: #fbbf24; color: #fbbf24;">Skip 24 Clock Hours [Instant Burst]</div>
                        ${createToggle('Loop 1 Week Per Second', 'loopWeek', 'Forces calculation of 7 full days each second')}

                        <div class="section-title">Performance Core Opts</div>
                        ${createToggle('FPS V-Sync Unlocker', 'fpsUnlocker', 'Bypasses browser refresh-rate limitations')}
                        ${createToggle('Anti-Lag Optimization', 'antiLag', 'Prunes canvas layout checks to clear stutter')}

                        <div class="section-title">Telemetry Diagnostics</div>
                        <div class="mod-row"><span class="mod-label">Session Clicks</span><span id="stat-clicks" style="color:var(--theme-color); font-weight:bold; font-family:monospace; font-size: 14px;">0</span></div>
                        <div class="mod-row"><span class="mod-label">Execution Time</span><span id="stat-time" style="color:var(--theme-color); font-weight:bold; font-family:monospace; font-size: 14px;">00:00</span></div>
                    </div>

                    <div class="tab-content" id="tab-visuals">
                        <div class="section-title">Color Modifiers</div>
                        ${createToggle('Chroma RGB UI Mode', 'chromaTheme', 'Continuously shifts client colors')}
                        ${createToggle('Rainbow Game Canvas Mode', 'rainbowMode', 'Cycles canvas color matrix automatically')}
                        ${createSlider('Rainbow Multiplier Speed', 'rainbowSpeed', 0.5, 15.0, 0.5, 'x')}
                        
                        <div class="section-title">Canvas Transforms & Filters</div>
                        ${createSlider('Field of View / Zoom', 'zoom', 0.2, 3.0, 0.05, 'x')}
                        ${createSlider('Z-Axis Rotation', 'rotation', -180, 180, 1, '°')}
                        ${createToggle('Mirror Screen Coordinate (Flip X)', 'invertX')}
                        ${createToggle('Invert Gravity Render (Flip Y)', 'invertY')}
                        ${createSlider('Exposure / Brightness', 'brightness', 10, 250, 5, '%')}
                        ${createSlider('Color Saturation Intensity', 'saturation', 0, 400, 5, '%')}
                        ${createSlider('Image Contrast Value', 'contrast', 10, 250, 5, '%')}
                        ${createSlider('Static Hue Target Shift', 'hue', 0, 360, 5, '°')}
                        ${createSlider('Hardware Blur Filter', 'blur', 0, 15, 0.5, 'px')}
                        ${createSlider('Invert Color Matrix', 'invertColors', 0, 100, 5, '%')}
                        ${createSlider('Grayscale Profile', 'grayscale', 0, 100, 5, '%')}
                        ${createSlider('Sepia Retro Filter', 'sepia', 0, 100, 5, '%')}

                        <div class="section-title">Canvas HUD Overlays</div>
                        ${createToggle('Display Target Tracking Path Line', 'showAimLine')}
                        ${createToggle('Display Level Map Grid Vector', 'showGrid')}
                        ${createSlider('Grid Mesh Dimension Scaling', 'gridSize', 20, 150, 5, 'px')}
                    </div>

                    <div class="tab-content" id="tab-macros">
                        <div class="section-title">Wave Input Spammer</div>
                        ${createToggle('Enable Input Auto-Clicker', 'autoClickerActive', 'Fires input signals precisely at standard targets')}
                        ${createSlider('Target CPS Calculation Rate', 'autoClickerCPS', 1, 200, 1, ' CPS')}
                        ${createToggle('Jitter Variance Matrix', 'jitterClick', 'Alters click delay maps to emulate human inputs')}
                        ${createSlider('Jitter Displacement Amplitude', 'jitterIntensity', 1, 15, 1, 'ms')}
                    </div>

                    <div class="tab-content" id="tab-training">
                        <div class="section-title">Target Assistance</div>
                        ${createSlider('Canvas Overlay Opacity (Ghost)', 'ghostMode', 5, 100, 5, '%')}
                        
                        <div class="section-title">Speed Control Hub</div>
                        <div class="btn-group">
                            <div class="gd-btn preset-btn" data-speed="0.1">0.10x</div>
                            <div class="gd-btn preset-btn" data-speed="0.25">0.25x</div>
                            <div class="gd-btn preset-btn" data-speed="0.5">0.50x</div>
                            <div class="gd-btn preset-btn" data-speed="0.75">0.75x</div>
                            <div class="gd-btn preset-btn" data-speed="1.0">1.00x</div>
                            <div class="gd-btn preset-btn" data-speed="1.5">1.50x</div>
                            <div class="gd-btn preset-btn" data-speed="2.0">2.00x</div>
                        </div>

                        <div class="section-title">Crosshair Config</div>
                        ${createToggle('Enable Custom Fixed Crosshair', 'showCrosshair')}
                        ${createSelect('Crosshair Style Profile', 'crosshairType', [
                            { value: 'dot', text: 'Center Precision Dot' },
                            { value: 'cross', text: 'Tactical Plus Cross' },
                            { value: 'reticle', text: 'Aviation Spec Reticle' }
                        ])}
                        ${createSelect('Crosshair Color Assignment', 'crosshairColor', [
                            { value: '#00ffcc', text: 'Hyper Cyan' },
                            { value: '#ef4444', text: 'Crimson Red' },
                            { value: '#10b981', text: 'Matrix Green' },
                            { value: '#eab308', text: 'Vibrant Yellow' },
                            { value: '#ffffff', text: 'Solid White' }
                        ])}
                    </div>

                    <div class="tab-content" id="tab-mods">
                        <div class="section-title">Displacement Modifiers</div>
                        ${createToggle('Seismic Canvas Earthquake', 'earthquake', 'Simulates intense viewport disturbances')}
                        ${createSlider('Earthquake Vector Intensity', 'earthquakeIntensity', 1, 25, 1, 'px')}
                        
                        <div class="section-title">Color Overload</div>
                        ${createToggle('Deep Fried Artifact Profiler', 'deepFried', 'Pushes contrast configurations past boundaries')}
                        
                        <div class="section-title">Sight Impediments</div>
                        ${createToggle('Spotlight Flashlight Mode', 'flashlight', 'Obscures entire field except localized circle')}
                        ${createSlider('Flashlight Viewport Radius', 'flashlightRadius', 30, 200, 5, 'px')}
                        ${createToggle('Cinematic Aspect Masking', 'cinematic', 'Applies widescreen horizontal focal blocks')}
                        ${createToggle('High Gradient Vignette', 'vignette', 'Darkens perspective perimeters smoothly')}
                    </div>

                    <div class="tab-content" id="tab-config">
                        <div class="section-title">Interface Orientation</div>
                        ${createSelect('Navigation Tab Position', 'tabPosition', [
                            { value: 'left', text: 'Left Sidebar' },
                            { value: 'right', text: 'Right Sidebar' },
                            { value: 'top', text: 'Top Horizontal' }
                        ])}

                        <div class="section-title">Interface Density & Dimensions</div>
                        ${createSlider('Menu Alpha Transparency', 'menuOpacity', 0.2, 1.0, 0.02, '')}
                        ${createSlider('Menu Width (X) Rescale', 'menuScaleX', 0.9, 2.5, 0.1, 'x')}
                        ${createSlider('Menu Height (Y) Rescale', 'menuScaleY', 0.9, 2.5, 0.1, 'x')}
                        
                        <div class="section-title">System Visuals</div>
                        ${createSelect('Real Cursor Style', 'realCursor', [
                            { value: 'default', text: 'System Default' },
                            { value: 'crosshair', text: 'Target Crosshair' },
                            { value: 'pointer', text: 'Hand Pointer' },
                            { value: 'none', text: 'Hidden completely' }
                        ])}

                        <div class="section-title">Macro Inputs</div>
                        <div class="mod-row">
                            <span class="mod-label">Toggle Menu Bind<span class="mod-subtext">Click save after edit</span></span>
                            <input type="text" class="gd-select" style="width: 50px; text-align:center;" id="inp-toggleKey" value="${config.toggleKey.toUpperCase()}" maxlength="1">
                        </div>
                        <div class="mod-row">
                            <span class="mod-label">Macro Click Bind<span class="mod-subtext">Hold key down to trigger</span></span>
                            <input type="text" class="gd-select" style="width: 50px; text-align:center;" id="inp-macroKey" value="${config.macroKey.toUpperCase()}" maxlength="1">
                        </div>
                        
                        <div class="section-title">Platform Toggles</div>
                        ${createToggle('Force On-Screen Device Toggles', 'showMobileControls', 'Generates floating toggle buttons for Focus & Macro')}

                        <div class="section-title">Profile Database</div>
                        <div class="gd-btn" id="btn-save">Save Profile Settings</div>
                        <div class="gd-btn" id="btn-load">Reload Settings Profile</div>
                        <div class="gd-btn" style="border-color:#ef4444; color:#ef4444; margin-top:8px;" id="btn-reset">Wipe Configuration Cache</div>
                    </div>
                </div>
            </div>
            <div class="gd-footer" id="gd-footer-handle">Press your designated UI key or FAB to hide menu</div>
        `;
        document.body.appendChild(menu);

        // Warning Dismissal Logic
        const warnBox = document.getElementById('gd-anti-lag-warning');
        if (warnBox && !config.dismissedAntiLagWarning) {
            warnBox.style.display = 'flex';
            let timeLeft = 10;
            const dismissBtn = document.getElementById('btn-dismiss-warning');
            
            const timer = setInterval(() => {
                timeLeft--;
                if (timeLeft <= 0) {
                    clearInterval(timer);
                    if (dismissBtn) {
                        dismissBtn.innerText = "Dismiss";
                        dismissBtn.style.opacity = "1";
                        dismissBtn.style.cursor = "pointer";
                        dismissBtn.style.pointerEvents = "auto";
                        dismissBtn.disabled = false;
                    }
                } else {
                    if (dismissBtn) dismissBtn.innerText = `Dismiss (${timeLeft})`;
                }
            }, 1000);

            dismissBtn.addEventListener('click', () => {
                warnBox.style.display = 'none';
                config.dismissedAntiLagWarning = true;
            });
        }

        const fab = document.createElement('div');
        fab.id = 'gd-mobile-toggle';
        fab.innerHTML = '⚙️';
        document.body.appendChild(fab);

        const mobileControls = document.createElement('div');
        mobileControls.id = 'gd-mobile-controls';
        mobileControls.innerHTML = `
            <div class="gd-mc-btn" id="gd-mc-focus">Focus</div>
            <div class="gd-mc-btn" id="gd-mc-macro">Macro</div>
        `;
        document.body.appendChild(mobileControls);
        
        requestAnimationFrame(() => {
            setTimeout(() => {
                menu.classList.add('menu-visible');
            }, 50);
        });

        setupTabSwitching();
        setupInputListeners();
    }

    function createSlider(label, key, min, max, step, unit) {
        return `
        <div class="range-container">
            <div class="range-header">
                <span>${label}</span>
                <div class="range-val-container">
                    <input type="text" class="range-val-input" id="num-${key}" data-key="${key}" data-min="${min}" data-max="${max}" value="${config[key]}">
                    <span class="range-unit">${unit}</span>
                </div>
            </div>
            <input type="range" min="${min}" max="${max}" step="${step}" value="${config[key]}" class="gd-range" id="sl-${key}" data-key="${key}" data-unit="${unit}">
        </div>`;
    }

    function createToggle(label, key, subtext = '') {
        const checked = config[key] ? 'checked' : '';
        return `
        <div class="mod-row">
            <div class="mod-label">${label} <span class="mod-subtext">${subtext}</span></div>
            <label class="switch"><input type="checkbox" id="tg-${key}" data-key="${key}" ${checked}><span class="slider"></span></label>
        </div>`;
    }

    function createSelect(label, key, options) {
        let optsHTML = options.map(opt => `<option value="${opt.value}" ${config[key] === opt.value ? 'selected' : ''}>${opt.text}</option>`).join('');
        return `
        <div class="mod-row">
            <div class="mod-label">${label}</div>
            <select class="gd-select" data-key="${key}">
                ${optsHTML}
            </select>
        </div>`;
    }

    // =========================================================
    // 4. PIPELINE REDUCTION LOGIC
    // =========================================================
    let canvasTarget = null;
    let unityContainer = null;
    let sessionClicks = 0;
    let sessionStartTime = Date.now();

    function setupTabSwitching() {
        const tabs = document.querySelectorAll('.gd-tab');
        const contents = document.querySelectorAll('.tab-content');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                contents.forEach(c => c.classList.remove('active'));
                
                tab.classList.add('active');
                const targetContent = document.getElementById(tab.dataset.target);
                targetContent.classList.add('active');
            });
        });
    }

    let lastFilterString = "";
    let lastTransformString = "";

    function applyAllVisuals() {
        if (!canvasTarget) canvasTarget = document.querySelector("#unity-canvas");
        
        document.body.style.cursor = config.realCursor;
        if(canvasTarget) canvasTarget.style.cursor = config.realCursor;
        
        if (!canvasTarget) return;

        // Ensure controls display logic works universally (Mobile automatic, PC by toggle)
        const shouldShowControls = isMobileDevice || config.showMobileControls;
        const mControls = document.getElementById('gd-mobile-controls');
        const mToggle = document.getElementById('gd-mobile-toggle');

        if (mControls) {
            mControls.style.display = shouldShowControls ? 'flex' : 'none';
        }
        if (mToggle) {
            mToggle.style.display = shouldShowControls ? 'flex' : 'none';
        }

        // Handle Rescaling
        const menuEl = document.getElementById('gd-standalone-menu');
        if (menuEl) {
            menuEl.style.width = (520 * config.menuScaleX) + 'px';
            menuEl.style.height = (600 * config.menuScaleY) + 'px';
        }

        canvasTarget.style.opacity = config.ghostMode / 100;
        canvasTarget.style.transition = 'none';

        let appliedAlpha = config.antiLag ? 1.0 : config.menuOpacity;
        document.documentElement.style.setProperty('--bg-color', `rgba(18, 18, 24, ${appliedAlpha})`);

        if (config.antiLag) {
            if (canvasTarget.style.imageRendering !== 'pixelated') canvasTarget.style.imageRendering = 'pixelated';
            if (canvasTarget.style.willChange !== 'transform') canvasTarget.style.willChange = 'transform';
            
            if (menuEl && menuEl.style.backdropFilter !== 'none') menuEl.style.backdropFilter = 'none';
        } else {
            if (canvasTarget.style.imageRendering !== 'auto') canvasTarget.style.imageRendering = 'auto';
            if (canvasTarget.style.willChange !== 'auto') canvasTarget.style.willChange = 'auto';
            
            if (menuEl && menuEl.style.backdropFilter !== 'blur(24px) saturate(140%)') menuEl.style.backdropFilter = 'blur(24px) saturate(140%)';
        }

        const elementsWithDisplayToggles = [
            { id: 'gd-aim-line', active: config.showAimLine },
            { id: 'gd-grid-overlay', active: config.showGrid },
            { id: 'gd-flashlight-overlay', active: config.flashlight },
            { id: 'gd-cinematic-overlay', active: config.cinematic },
            { id: 'gd-vignette-overlay', active: config.vignette },
            { id: 'gd-crosshair-overlay', active: config.showCrosshair }
        ];

        elementsWithDisplayToggles.forEach(item => {
            const el = document.getElementById(item.id);
            if (el) {
                const calculatedDisplay = item.active ? 'block' : 'none';
                if (el.style.display !== calculatedDisplay) el.style.display = calculatedDisplay;
            }
        });

        const grid = document.getElementById('gd-grid-overlay');
        if (grid && config.showGrid) {
            grid.style.backgroundSize = `${config.gridSize}px ${config.gridSize}px`;
        }

        const flash = document.getElementById('gd-flashlight-overlay');
        if (flash && config.flashlight) {
            flash.style.background = `radial-gradient(circle at 50% 50%, transparent ${config.flashlightRadius}px, rgba(0,0,0,0.98) ${config.flashlightRadius + 50}px)`;
        }

        const ch = document.getElementById('gd-crosshair-overlay');
        if (ch && config.showCrosshair) {
            document.documentElement.style.setProperty('--crosshair-color', config.crosshairColor);
            if (!ch.querySelector(`.ch-${config.crosshairType}`)) {
                ch.innerHTML = `<div class="ch-${config.crosshairType}"></div>`;
            }
        }
    }

    function syncSpeedMultiplier() {
        if (isTimeSkipping) return; 
        if (config.loopWeek) {
            speedMultiplier = 604800; 
        } else if (shiftHeld || mobileFocusActive) { 
            speedMultiplier = config.focusSpeed;
        } else {
            speedMultiplier = config.baseSpeed;
        }
    }

    function setupInputListeners() {
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && document.activeElement) {
                const tag = document.activeElement.tagName;
                const type = document.activeElement.type;
                if ((tag === 'INPUT' && (type === 'checkbox' || type === 'range')) || tag === 'BUTTON' || document.activeElement.classList.contains('gd-btn')) {
                    e.preventDefault();
                }
            }
        });

        document.querySelectorAll('.gd-range').forEach(sl => {
            sl.addEventListener('input', (e) => {
                const key = e.target.dataset.key;
                const val = parseFloat(e.target.value);
                config[key] = val;
                
                const numInput = document.getElementById(`num-${key}`);
                if(numInput) numInput.value = val;
                
                if (key === 'baseSpeed' || key === 'focusSpeed') syncSpeedMultiplier();
                if (key !== 'rainbowSpeed') applyAllVisuals();
            });
        });
        
        document.querySelectorAll('.range-val-input').forEach(inp => {
            inp.addEventListener('change', (e) => {
                const key = e.target.dataset.key;
                let val = parseFloat(e.target.value);
                const min = parseFloat(e.target.dataset.min);
                const max = parseFloat(e.target.dataset.max);
                
                if (isNaN(val)) val = config[key]; 
                if (val < min) val = min;
                if (val > max) val = max;
                
                e.target.value = val; 
                config[key] = val;
                
                const slider = document.getElementById(`sl-${key}`);
                if (slider) slider.value = val;
                
                if (key === 'baseSpeed' || key === 'focusSpeed') syncSpeedMultiplier();
                if (key !== 'rainbowSpeed') applyAllVisuals();
            });
        });

        document.querySelectorAll('input[type="checkbox"]').forEach(tg => {
            tg.addEventListener('change', (e) => {
                const key = e.target.dataset.key;
                config[key] = e.target.checked;
                e.target.blur(); 
                
                if (key === 'loopWeek') syncSpeedMultiplier();
                applyAllVisuals();
            });
        });

        document.querySelectorAll('.gd-select').forEach(sel => {
            sel.addEventListener('change', (e) => {
                const key = e.target.dataset.key;
                config[key] = e.target.value;
                if (key === 'tabPosition') {
                    document.getElementById('gd-content-wrapper').className = `gd-content-wrapper pos-${config.tabPosition}`;
                }
                applyAllVisuals();
                e.target.blur();
            });
        });

        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const speed = parseFloat(e.target.dataset.speed);
                config.baseSpeed = speed;
                syncSpeedMultiplier(); 
                document.getElementById('sl-baseSpeed').value = speed;
                document.getElementById('num-baseSpeed').value = speed;
            });
        });

        const btnFocus = document.getElementById('gd-mc-focus');
        if (btnFocus) {
            btnFocus.addEventListener('click', () => {
                mobileFocusActive = !mobileFocusActive;
                btnFocus.classList.toggle('active', mobileFocusActive);
                syncSpeedMultiplier();
            });
        }

        const btnMacro = document.getElementById('gd-mc-macro');
        if (btnMacro) {
            btnMacro.addEventListener('click', () => {
                mobileMacroActive = !mobileMacroActive;
                btnMacro.classList.toggle('active', mobileMacroActive);
                if (mobileMacroActive && !autoClickTimer) triggerAutoClick();
            });
        }

        document.getElementById('btn-timeskip').addEventListener('click', (e) => {
            if (isTimeSkipping || config.loopWeek) return; 
            isTimeSkipping = true;
            
            const btn = e.target;
            const originalText = btn.innerText;
            btn.innerText = "Processing Skips...";
            btn.style.borderColor = "#ef4444";
            btn.style.color = "#ef4444";

            speedMultiplier = 86400;

            setTimeout(() => {
                isTimeSkipping = false;
                syncSpeedMultiplier(); 
                btn.innerText = originalText;
                btn.style.borderColor = "#fbbf24";
                btn.style.color = "#fbbf24";
            }, 1000);
        });

        document.getElementById('btn-save').addEventListener('click', () => {
            const tKey = document.getElementById('inp-toggleKey').value.toLowerCase();
            const mKey = document.getElementById('inp-macroKey').value.toLowerCase();
            if(tKey) config.toggleKey = tKey;
            if(mKey) config.macroKey = mKey;
            saveConfig();
        });
        
        document.getElementById('btn-load').addEventListener('click', () => { loadConfig(); location.reload(); });
        document.getElementById('btn-reset').addEventListener('click', resetConfig);

        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' && e.target.type === 'text' || e.target.tagName === 'SELECT') return;
            if (e.key === 'Shift') { 
                shiftHeld = true; 
                syncSpeedMultiplier(); 
            }
            if (e.key.toLowerCase() === config.toggleKey) {
                const menu = document.getElementById('gd-standalone-menu');
                if (menu) menu.classList.toggle('menu-hidden');
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.target.tagName === 'INPUT' && e.target.type === 'text' || e.target.tagName === 'SELECT') return;
            if (e.key === 'Shift') { 
                shiftHeld = false; 
                syncSpeedMultiplier(); 
            }
        });

        document.addEventListener('mousedown', () => {
            sessionClicks++;
            const el = document.getElementById('stat-clicks');
            if (el) el.innerText = sessionClicks;
        });
        document.addEventListener('touchstart', () => {
            sessionClicks++;
            const el = document.getElementById('stat-clicks');
            if (el) el.innerText = sessionClicks;
        }, {passive: true});
    }

    // =========================================================
    // 5. INPUT SPOOFING ROUTER
    // =========================================================
    function simulateKey(state) {
        if (!canvasTarget) return;

        const ev = new KeyboardEvent(state, { bubbles: true, keyCode: 32, code: 'Space', key: ' ' });
        canvasTarget.dispatchEvent(ev);
    }

    let autoClickTimer = null;
    let spamKeyHeld = false;

    function triggerAutoClick() {
        if (!config.autoClickerActive || (!spamKeyHeld && !mobileMacroActive)) {
            autoClickTimer = null;
            return;
        }
        
        let cps = Math.max(1, config.autoClickerCPS);
        let delay = 1000 / cps; 

        if (config.jitterClick) {
            const intensity = config.jitterIntensity;
            delay += (Math.random() * (intensity * 2) - intensity);
        }

        simulateKey('keydown');
        setTimeout(() => simulateKey('keyup'), Math.max(5, Math.min(delay / 2, 25))); 

        autoClickTimer = setTimeout(triggerAutoClick, Math.max(1, delay));
    }

    document.addEventListener('keydown', e => { 
        if (e.target.tagName === 'INPUT' && e.target.type === 'text' || e.target.tagName === 'SELECT') return;
        if (e.key.toLowerCase() === config.macroKey && !spamKeyHeld) { 
            spamKeyHeld = true; 
            if (!autoClickTimer) triggerAutoClick();
        } 
    });
    
    document.addEventListener('keyup', e => { 
        if (e.target.tagName === 'INPUT' && e.target.type === 'text' || e.target.tagName === 'SELECT') return;
        if (e.key.toLowerCase() === config.macroKey) spamKeyHeld = false; 
    });

    // =========================================================
    // 6. RENDER LOOP CONTROLS
    // =========================================================
    function initGameLoopLogic() {
        canvasTarget = document.querySelector("#unity-canvas");
        unityContainer = document.querySelector("#unity-container");

        if (unityContainer) {
            if(window.getComputedStyle(unityContainer).position === 'static') {
                unityContainer.style.position = 'relative';
            }
            
            const overlays = `
                <div id="gd-aim-line"></div>
                <div id="gd-grid-overlay"></div>
                <div id="gd-flashlight-overlay"></div>
                <div id="gd-cinematic-overlay"></div>
                <div id="gd-vignette-overlay"></div>
                <div id="gd-crosshair-overlay"></div>
            `;
            if (!document.getElementById('gd-flashlight-overlay')) {
                unityContainer.insertAdjacentHTML('beforeend', overlays);
            }
        }

        applyAllVisuals();

        let lastTime = originalPerfNow();
        let frames = 0;
        let currentRainbowHue = config.hue;
        let chromaHue = 180; 
        
        function updateLoop() {
            frames++;
            const now = originalPerfNow();
            
            if (now >= lastTime + 1000) {
                const fps = Math.round((frames * 1000) / (now - lastTime));
                const fpsEl = document.getElementById('fps-counter');
                if(fpsEl) fpsEl.innerText = `${fps} FPS`;
                frames = 0;
                lastTime = now;

                const elapsed = Math.floor((originalDateNow() - sessionStartTime) / 1000);
                const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
                const secs = String(elapsed % 60).padStart(2, '0');
                const timeEl = document.getElementById('stat-time');
                if(timeEl) timeEl.innerText = `${mins}:${secs}`;
            }

            if (config.chromaTheme) {
                chromaHue = (chromaHue + 1) % 360;
                const dynamicThemeColor = `hsl(${chromaHue}, 100%, 50%)`;
                document.documentElement.style.setProperty('--theme-color', dynamicThemeColor);
                document.documentElement.style.setProperty('--text-glow', `0 0 12px ${dynamicThemeColor}`);
                
                const fab = document.getElementById('gd-mobile-toggle');
                if (fab) {
                    fab.style.color = dynamicThemeColor;
                    fab.style.borderColor = dynamicThemeColor;
                }
            }

            if (canvasTarget) {
                if (config.antiLag) {
                    if (canvasTarget.style.filter !== 'none') canvasTarget.style.filter = 'none';
                } else {
                    let dynamicHue = config.hue;
                    let cContrast = config.contrast;
                    let cSat = config.saturation;

                    if (config.rainbowMode) {
                        currentRainbowHue = (currentRainbowHue + config.rainbowSpeed) % 360;
                        dynamicHue = currentRainbowHue;
                    }

                    if (config.deepFried) {
                        cContrast = 250;
                        cSat = 400;
                    }

                    const filterString = `brightness(${config.brightness}%) contrast(${cContrast}%) saturate(${cSat}%) hue-rotate(${dynamicHue}deg) blur(${config.blur}px) invert(${config.invertColors}%) grayscale(${config.grayscale}%) sepia(${config.sepia}%)`;
                    
                    if (lastFilterString !== filterString) {
                        canvasTarget.style.filter = filterString;
                        lastFilterString = filterString;
                    }
                }

                let transX = 0;
                let transY = 0;
                let scaleX = config.invertX ? (config.zoom * -1) : config.zoom;
                let scaleY = config.invertY ? (config.zoom * -1) : config.zoom;
                let dynamicRot = config.rotation;

                if (config.earthquake) {
                    const amp = config.earthquakeIntensity;
                    transX = (Math.random() * amp - (amp / 2));
                    transY = (Math.random() * amp - (amp / 2));
                }

                const transformString = `translate3d(${transX}px, ${transY}px, 0) scale(${scaleX}, ${scaleY}) rotate(${dynamicRot}deg)`;
                if (lastTransformString !== transformString) {
                    canvasTarget.style.transform = transformString;
                    lastTransformString = transformString;
                }
            }

            requestAnimationFrame(updateLoop);
        }
        requestAnimationFrame(updateLoop);
    }

    // =========================================================
    // 7. DRAGGING ENGINE (REBUILT FOR POINTER EVENTS)
    // =========================================================
    function setupDragging() {
        const menu = document.getElementById('gd-standalone-menu');
        const headerHandle = document.getElementById('gd-handle');
        const footerHandle = document.getElementById('gd-footer-handle');
        
        let isMenuDragging = false;
        let menuStartX = 0, menuStartY = 0;
        let menuInitialLeft = 0, menuInitialTop = 0;

        function onMenuPointerDown(e) {
            if (e.target.closest('input, select, .gd-btn, .gd-tab')) return;
            isMenuDragging = true;
            
            const rect = menu.getBoundingClientRect();
            menuInitialLeft = rect.left;
            menuInitialTop = rect.top;
            
            menuStartX = e.clientX;
            menuStartY = e.clientY;

            menu.style.left = menuInitialLeft + 'px';
            menu.style.top = menuInitialTop + 'px';

            document.addEventListener('pointermove', onMenuPointerMove, {passive: false});
            document.addEventListener('pointerup', onMenuPointerUp);
        }

        function onMenuPointerMove(e) {
            if (!isMenuDragging) return;
            e.preventDefault(); 
            
            const dx = e.clientX - menuStartX;
            const dy = e.clientY - menuStartY;
            
            menu.style.left = (menuInitialLeft + dx) + 'px';
            menu.style.top = (menuInitialTop + dy) + 'px';
        }

        function onMenuPointerUp() {
            isMenuDragging = false;
            document.removeEventListener('pointermove', onMenuPointerMove);
            document.removeEventListener('pointerup', onMenuPointerUp);
        }

        headerHandle.addEventListener('pointerdown', onMenuPointerDown);
        footerHandle.addEventListener('pointerdown', onMenuPointerDown);

        const fab = document.getElementById('gd-mobile-toggle');
        let isFabDragging = false;
        let hasFabMoved = false;
        let fabStartX = 0, fabStartY = 0;
        let fabInitialLeft = 0, fabInitialTop = 0;

        function onFabPointerDown(e) {
            isFabDragging = true;
            hasFabMoved = false;

            fabStartX = e.clientX;
            fabStartY = e.clientY;

            const rect = fab.getBoundingClientRect();
            fabInitialLeft = rect.left;
            fabInitialTop = rect.top;

            document.addEventListener('pointermove', onFabPointerMove, {passive: false});
            document.addEventListener('pointerup', onFabPointerUp);
        }

        function onFabPointerMove(e) {
            if (!isFabDragging) return;

            const dx = e.clientX - fabStartX;
            const dy = e.clientY - fabStartY;

            if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
                hasFabMoved = true;
                e.preventDefault(); 
                
                fab.style.bottom = 'auto';
                fab.style.right = 'auto';
                fab.style.left = (fabInitialLeft + dx) + 'px';
                fab.style.top = (fabInitialTop + dy) + 'px';
            }
        }

        function onFabPointerUp() {
            isFabDragging = false;
            document.removeEventListener('pointermove', onFabPointerMove);
            document.removeEventListener('pointerup', onFabPointerUp);

            if (!hasFabMoved && menu) {
                menu.classList.toggle('menu-hidden');
            }
        }

        fab.addEventListener('pointerdown', onFabPointerDown);
    }

    function init() {
        buildModMenu();
        setupDragging();
        setTimeout(initGameLoopLogic, 400); 
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        init();
    } else {
        window.addEventListener('DOMContentLoaded', init);
    }
})();
