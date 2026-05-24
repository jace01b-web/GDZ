(function() {
  // ==========================================
  // --- Loading Screen Feature ---
  // ==========================================
  const runLoadingScreen = () => {
    const style = document.createElement('style');
    style.innerHTML = `
      @font-face {
        font-family: 'Starborn';
        src: url('Starborn.ttf') format('truetype');
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      @keyframes pulseText {
        0% { opacity: 0.5; }
        50% { opacity: 1; }
        100% { opacity: 0.5; }
      }
      .custom-loading-text {
        color: #ffffff; 
        font-family: 'Starborn', sans-serif;
        font-size: 26px;
        letter-spacing: 2px;
        margin-top: 25px;
        animation: pulseText 1.8s infinite ease-in-out;
      }
      .custom-spinner {
        width: 45px;
        height: 45px;
        border: 4px solid rgba(255, 255, 255, 0.1);
        border-top: 4px solid #ffffff;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin: 0 auto;
      }
      .loading-image {
        max-width: 80vw;
        max-height: 30vh;
        object-fit: contain;
        border-radius: 8px;
        margin-bottom: 15px;
      }
    `;
    document.head.appendChild(style);

    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.backgroundColor = '#000000'; 
    overlay.style.zIndex = '2147483647'; 
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.transition = 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.6s';
    overlay.style.opacity = '1';
    overlay.style.visibility = 'visible';

    const contentWrapper = document.createElement('div');
    contentWrapper.style.display = 'flex';
    contentWrapper.style.flexDirection = 'column';
    contentWrapper.style.alignItems = 'center';
    contentWrapper.style.transition = 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    contentWrapper.style.opacity = '0'; 
    contentWrapper.style.transform = 'translateY(30px)';

    const img1 = document.createElement('img');
    img1.src = 'Bocchi icon.png'; 
    img1.className = 'loading-image';

    const img2 = document.createElement('img');
    img2.src = 'creds.png'; 
    img2.className = 'loading-image';
    img2.style.marginBottom = '35px';

    const spinner = document.createElement('div');
    spinner.className = 'custom-spinner';

    const loadingText = document.createElement('div');
    loadingText.className = 'custom-loading-text';
    loadingText.innerText = 'Loading...';

    contentWrapper.appendChild(img1);
    contentWrapper.appendChild(img2);
    contentWrapper.appendChild(spinner);
    contentWrapper.appendChild(loadingText);
    overlay.appendChild(contentWrapper);
    document.body.appendChild(overlay);

    setTimeout(() => {
      contentWrapper.style.opacity = '1';
      contentWrapper.style.transform = 'translateY(0)';
    }, 50);

    const removeLoadingScreen = () => {
      contentWrapper.style.opacity = '0';
      contentWrapper.style.transform = 'translateY(-20px)';
      
      setTimeout(() => {
        overlay.style.opacity = '0';
        overlay.style.visibility = 'hidden';
        
        setTimeout(() => {
          if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        }, 600);
      }, 300);
    };

    setTimeout(removeLoadingScreen, 5000); 
  };

  // ==========================================
  // --- GUI Features (Fullscreen & Cloak) ---
  // ==========================================
  const initGUI = () => {
    
    const isFullscreen = () => {
      return document.fullscreenElement || 
             document.webkitFullscreenElement || 
             document.mozFullScreenElement || 
             document.msFullscreenElement;
    };

    const requestFullscreen = (element) => {
      if (element.requestFullscreen) element.requestFullscreen();
      else if (element.webkitRequestFullscreen) element.webkitRequestFullscreen();
      else if (element.mozRequestFullScreen) element.mozRequestFullScreen();
      else if (element.msRequestFullscreen) element.msRequestFullscreen();
    };

    const exitFullscreen = () => {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
      else if (document.msExitFullscreen) document.msExitFullscreen();
    };

    const handleCloak = () => {
      if (window.name === 'cloaked' || window.location.protocol === 'about:') return;
      
      let win = window.open('about:blank', '_blank');
      if (win) {
        win.document.title = "Home - Classroom";
        let icon = win.document.createElement('link');
        icon.rel = 'icon';
        icon.href = 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Google_Classroom_Logo.svg/330px-Google_Classroom_Logo.svg.png';
        win.document.head.appendChild(icon);

        win.document.body.style.margin = '0';
        win.document.body.style.overflow = 'hidden';
        let iframe = win.document.createElement('iframe');
        iframe.src = window.location.href;
        iframe.name = 'cloaked';
        iframe.style.width = '100vw';
        iframe.style.height = '100vh';
        iframe.style.border = 'none';
        iframe.style.margin = '0';
        win.document.body.appendChild(iframe);

        window.location.replace('https://www.google.com');
      }
    };

    const createUI = () => {
      // --- Independent Tooltip Generators ---
      // By giving each button its own tooltip element, we prevent CSS transition overlapping bugs
      const createTooltipElement = () => {
        const tt = document.createElement('div');
        tt.style.position = 'fixed';
        tt.style.background = 'rgba(25, 25, 25, 0.95)';
        tt.style.color = '#ffffff';
        tt.style.padding = '8px 14px';
        tt.style.borderRadius = '6px';
        tt.style.fontFamily = 'system-ui, -apple-system, sans-serif';
        tt.style.fontSize = '13px';
        tt.style.fontWeight = '500';
        tt.style.pointerEvents = 'none'; 
        tt.style.zIndex = '2147483647';
        tt.style.opacity = '0';
        tt.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
        tt.style.transform = 'translateX(-10px)';
        tt.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)';
        tt.style.whiteSpace = 'nowrap';
        document.body.appendChild(tt);
        return tt;
      };

      const fsTooltip = createTooltipElement();
      const cloakTooltip = createTooltipElement();

      const showTooltip = (ttElem, targetElem, text) => {
        const rect = targetElem.getBoundingClientRect();
        ttElem.innerText = text;
        ttElem.style.left = (rect.right + 12) + 'px';
        ttElem.style.top = (rect.top + (rect.height / 2) - 16) + 'px'; 
        ttElem.style.opacity = '1';
        ttElem.style.transform = 'translateX(0)';
      };

      const hideTooltip = (ttElem) => {
        ttElem.style.opacity = '0';
        ttElem.style.transform = 'translateX(-10px)';
      };

      // --- Fullscreen Setup ---
      const fsIcon = document.createElement('img');
      fsIcon.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ffffff"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>';
      fsIcon.alt = "Toggle Fullscreen";
      fsIcon.style.position = 'fixed';
      fsIcon.style.top = '15px';
      fsIcon.style.left = '15px';
      fsIcon.style.width = '32px';
      fsIcon.style.height = '32px';
      fsIcon.style.cursor = 'pointer';
      fsIcon.style.zIndex = '2147483646'; 
      fsIcon.style.filter = 'drop-shadow(0px 2px 4px rgba(0,0,0,0.8))'; 
      fsIcon.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
      fsIcon.style.opacity = '0.6';
      fsIcon.style.display = 'block'; 

      fsIcon.onmouseenter = () => { 
        fsIcon.style.transform = 'scale(1.15)'; 
        fsIcon.style.opacity = '1'; 
        showTooltip(fsTooltip, fsIcon, isFullscreen() ? "Exit Fullscreen" : "Enter Fullscreen");
      };
      fsIcon.onmouseleave = () => { 
        fsIcon.style.transform = 'scale(1)'; 
        fsIcon.style.opacity = '0.6'; 
        hideTooltip(fsTooltip);
      };
      fsIcon.onclick = () => {
        isFullscreen() ? exitFullscreen() : requestFullscreen(document.documentElement);
        hideTooltip(fsTooltip); 
      };

      // --- Cloak Setup ---
      const cloakIcon = document.createElement('img');
      cloakIcon.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ffffff"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>';
      cloakIcon.alt = "Cloak Site";
      cloakIcon.style.position = 'fixed';
      cloakIcon.style.top = '55px'; 
      cloakIcon.style.left = '15px';
      cloakIcon.style.width = '32px';
      cloakIcon.style.height = '32px';
      cloakIcon.style.cursor = 'pointer';
      cloakIcon.style.zIndex = '2147483646'; 
      cloakIcon.style.filter = 'drop-shadow(0px 2px 4px rgba(0,0,0,0.8))'; 
      cloakIcon.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
      cloakIcon.style.opacity = '0.6';
      cloakIcon.style.display = 'block'; 

      cloakIcon.onmouseenter = () => { 
        cloakIcon.style.transform = 'scale(1.15)'; 
        cloakIcon.style.opacity = '1'; 
        showTooltip(cloakTooltip, cloakIcon, "Open in Cloaked Window");
      };
      cloakIcon.onmouseleave = () => { 
        cloakIcon.style.transform = 'scale(1)'; 
        cloakIcon.style.opacity = '0.6'; 
        hideTooltip(cloakTooltip);
      };
      cloakIcon.onclick = handleCloak;

      // Handle visibility on Fullscreen
      function handleFullscreenChange() {
        if (isFullscreen()) {
          fsIcon.style.display = 'none'; 
          cloakIcon.style.display = 'none'; 
        } else {
          fsIcon.style.display = 'block'; 
          cloakIcon.style.display = 'block';
        }
      }

      const events = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'];
      events.forEach(event => document.addEventListener(event, handleFullscreenChange));

      document.body.appendChild(fsIcon);
      document.body.appendChild(cloakIcon);
    };

    // Ensure body exists before injecting UI elements
    if (document.body) {
      createUI();
    } else {
      document.addEventListener('DOMContentLoaded', createUI);
    }
  };

  // --- Execution Execution order ---
  initGUI();
  runLoadingScreen();

})();