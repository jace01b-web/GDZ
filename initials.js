(function() {
  // ==========================================
  // --- Loading Screen Feature ---
  // ==========================================
  const runLoadingScreen = () => {
    // 1. Inject custom CSS for animations, the custom font, and layout styling
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
        color: #ffffff; /* Pure white text */
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

    // 2. Create the main background overlay
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

    // 3. Create a wrapper for the content animations
    const contentWrapper = document.createElement('div');
    contentWrapper.style.display = 'flex';
    contentWrapper.style.flexDirection = 'column';
    contentWrapper.style.alignItems = 'center';
    contentWrapper.style.transition = 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    contentWrapper.style.opacity = '0'; 
    contentWrapper.style.transform = 'translateY(30px)';

    // 4. Load Image 1: Bocchi icon.png
    const img1 = document.createElement('img');
    img1.src = 'Bocchi icon.png'; 
    img1.className = 'loading-image';

    // 5. Load Image 2: creds.png
    const img2 = document.createElement('img');
    img2.src = 'creds.png'; 
    img2.className = 'loading-image';
    img2.style.marginBottom = '35px'; // Extra spacing before the spinner

    // 6. Build Spinner & Text
    const spinner = document.createElement('div');
    spinner.className = 'custom-spinner';

    const loadingText = document.createElement('div');
    loadingText.className = 'custom-loading-text';
    loadingText.innerText = 'Loading...';

    // 7. Append elements inside container
    contentWrapper.appendChild(img1);
    contentWrapper.appendChild(img2);
    contentWrapper.appendChild(spinner);
    contentWrapper.appendChild(loadingText);
    overlay.appendChild(contentWrapper);
    document.body.appendChild(overlay);

    // 8. Entrance Animation Sequence
    setTimeout(() => {
      contentWrapper.style.opacity = '1';
      contentWrapper.style.transform = 'translateY(0)';
    }, 50);

    // 9. Exit Animation Sequence
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

    // 10. Event Listeners for Removal
    if (document.readyState === 'complete') {
      setTimeout(removeLoadingScreen, 1800); 
    } else {
      window.addEventListener('load', () => {
        setTimeout(removeLoadingScreen, 1200); 
      });
      setTimeout(removeLoadingScreen, 8000); 
    }
  };

  // ==========================================
  // --- Fullscreen Feature ---
  // ==========================================
  const initFullscreenToggle = () => {
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

    const fsIcon = document.createElement('img');
    fsIcon.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ffffff"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>';
    fsIcon.alt = "Toggle Fullscreen";
    
    fsIcon.style.position = 'fixed';
    fsIcon.style.top = '15px';
    fsIcon.style.left = '15px';
    fsIcon.style.width = '32px';
    fsIcon.style.height = '32px';
    fsIcon.style.cursor = 'pointer';
    // Kept just below loading screen screen z-index overlay so it can render first, 
    // but won't show over the black background layout until it clears.
    fsIcon.style.zIndex = '2147483646'; 
    fsIcon.style.filter = 'drop-shadow(0px 2px 4px rgba(0,0,0,0.8))'; 
    fsIcon.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
    fsIcon.style.opacity = '0.6';
    fsIcon.style.display = 'block'; 

    fsIcon.onmouseover = () => { 
      fsIcon.style.transform = 'scale(1.15)'; 
      fsIcon.style.opacity = '1'; 
    };
    fsIcon.onmouseout = () => { 
      fsIcon.style.transform = 'scale(1)'; 
      fsIcon.style.opacity = '0.6'; 
    };

    fsIcon.onclick = function(e) {
      if (!isFullscreen()) {
        requestFullscreen(document.documentElement);
      } else {
        exitFullscreen();
      }
    };

    function handleFullscreenChange() {
      if (isFullscreen()) {
        fsIcon.style.display = 'none'; 
      } else {
        fsIcon.style.display = 'block'; 
      }
    }

    const events = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'];
    events.forEach(event => document.addEventListener(event, handleFullscreenChange));
    
    if (document.body) {
      document.body.appendChild(fsIcon);
    } else {
      document.addEventListener('DOMContentLoaded', () => document.body.appendChild(fsIcon));
    }
  };

  // --- Execution Execution order (Icon setup runs first) ---
  initFullscreenToggle();
  runLoadingScreen();

})();