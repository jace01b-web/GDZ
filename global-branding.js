document.title = "Level 67 Modded - InitialsAndVoices";

function changeFavicon(src) {
    // Look for an existing icon link
    let link = document.querySelector("link[rel~='icon']");
    
    // If one doesn't exist, create it
    if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
    }
    
    // Set the icon source
    link.href = src;
}

// Apply the new icon
changeFavicon("Bocchi icon.png");