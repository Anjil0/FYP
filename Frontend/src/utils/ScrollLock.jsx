export const disableScroll = () => {
    // Store the current scroll position
    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    document.body.style.top = `-${scrollPosition}px`;
    
    // Add styles to prevent scrolling
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.overflowY = 'scroll';
  };
  
  export const enableScroll = () => {
    // Get the scroll position from the body's top property
    const scrollPosition = parseInt(document.body.style.top || '0', 10) * -1;
    
    // Remove the styles that prevented scrolling
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.top = '';
    document.body.style.overflowY = '';
    
    // Restore the scroll position
    window.scrollTo(0, scrollPosition);
  };