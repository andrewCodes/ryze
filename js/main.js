'strict-mode';

///////////////////////////////
// BURGER MENU

import getFocusableElements from './get-focusable-elements.js';

class BurgerMenu extends HTMLElement { // create new Class
    constructor() { // this initialises everything when loaded
      super(); // tell extended element to do the same
  
      const self = this; // allow us to access "this" lower down scope chain
  
      this.state = new Proxy( // Proxy allows us to observe and manipulate changes
        {
          status: 'open',
          enabled: false
        },
        {
          set(state, key, value) { // the set method will get fired every time a value of "state" changes
            const oldValue = state[key];
  
            state[key] = value;
            if (oldValue !== value) {
              self.processStateChange(); // if value has changed, fire this method
            }
            return state;
          }
        }
      );
    }
  
    get maxWidth() { // gets the max-width property from <burger-menu> and gives it a maxWidth value (used to determine whether or not to enable the burger menu)
      return parseInt(this.getAttribute('max-width') || 9999, 10);
    }
  
    connectedCallback() { // fires when the <burger-menu> is appended to the document. It is like a ready state. When the component is connected...
      this.initialMarkup = this.innerHTML; // ... store the markup inside the <burger-menu> (this is to render the same markup in our component and so if all fails in this component, we can re-render the markup as if there was no burger menu whatsoever)
      this.render(); // ... and render the component

      // the following is a low level COntainer Query. It means the burger menu could be put anywhere in a UI.

      const observer = new ResizeObserver(observedItems => { // this enables or disables the burger menu UI, based on the maxWidth property
        const {contentRect} = observedItems[0]; // the first item in observedItems is the site-head__inner
        this.state.enabled = contentRect.width <= this.maxWidth; // set state.enabled flag based on  wether or not is is less than, or equal to, our maxWidth property
      });
      
      observer.observe(this.parentNode); // watch the parent
      
    }
  
    render() { // creates HTML for burger menu incorporating the existing HTML (initialMarkup)
      this.innerHTML = `
        <div class="burger-menu" data-element="burger-root">
          <button class="burger-menu__trigger" data-element="burger-menu-trigger" type="button" aria-label="Open menu">
            <span class="burger-menu__bar" aria-hidden="true"></span>
          </button>
          <div class="burger-menu__panel" data-element="burger-menu-panel">
            ${this.initialMarkup} 
          </div>
        </div>
      `;
  
      this.postRender();
    }

    postRender() {
        this.trigger = this.querySelector('[data-element="burger-menu-trigger"]'); // grab the trigger
        this.panel = this.querySelector('[data-element="burger-menu-panel"]'); // grab the panel
        this.root = this.querySelector('[data-element="burger-root"]'); // grab the root
        this.focusableElements = getFocusableElements(this); // grab the foucsable elements
      
        if (this.trigger && this.panel) { // are the trigger and panel both present
          this.toggle();
      
          this.trigger.addEventListener('click', evt => { // attach event listener to trigger
            evt.preventDefault();
      
            this.toggle();
          });
      
          document.addEventListener('focusin', () => { // for accessibility... the burger menu covers the entire viewport. This means that if the user is shifting focus with their tab key and focus escapes the burger menu itself: they will lose focus visually. This focusin event listener on the document, outside of this component, tests to see if the currently focused element (i.e. document.activeElement) is inside our component...
            if (!this.contains(document.activeElement)) { // ... if it isn’t: we force the menu closed, immediately.
              this.toggle('closed');
            }
          });
      
          return;
        }
      
        this.innerHTML = this.initialMarkup; // progressive enhancement... if all fails, re-render the original markup
      }

      toggle(forcedStatus) { // pass an optional forceStatus parameter... lets us force the component into a specific, finite state: 'open' or 'closed'.
        if (forcedStatus) { // if the status is defined...
          if (this.state.status === forcedStatus) {
            return;
          }
      
          this.state.status = forcedStatus;
        } else { // if forcedStatus isn't defined set it based on curren status
          this.state.status = this.state.status === 'closed' ? 'open' : 'closed';
        }
      }
      
      processStateChange() { // this method will fire every time the state changes. It grabs the current state of the component and reflects it where necessary
        this.root.setAttribute('status', this.state.status); // set the root element's attrubutes
        this.root.setAttribute('enabled', this.state.enabled ? 'true' : 'false'); // set the root element's attrubutes
      
        this.manageFocus();
      
        switch (this.state.status) { // set aria states on the trigger
          case 'closed':
            this.trigger.setAttribute('aria-expanded', 'false');
            this.trigger.setAttribute('aria-label', 'Open menu');
            break;
          case 'open':
          case 'initial':
            this.trigger.setAttribute('aria-expanded', 'true');
            this.trigger.setAttribute('aria-label', 'Close menu');
            break;
        }
      }
      
      manageFocus() { // this is to allow us to add or remove tabindex. We add when closed so keyboard focus is not possible
        if (!this.state.enabled) {
          this.focusableElements.forEach(element => element.removeAttribute('tabindex'));
          return;
        }
      
        switch (this.state.status) {
          case 'open':
            this.focusableElements.forEach(element => element.removeAttribute('tabindex'));
            break;
          case 'closed':
            [...this.focusableElements] // This is called the "spread syntax"... we are converting our NodeList into an Array so we can use the filter() method to filter out the trigger element.
              .filter(
                element => element.getAttribute('data-element') !== 'burger-menu-trigger'
              )
              .forEach(element => element.setAttribute('tabindex', '-1'));
            break;
        }
      }
      
  }
  
  if ('customElements' in window) { // for progressive enhancement... we only apply the component if customeElements is available in the user's browser
    customElements.define('burger-menu', BurgerMenu); // apply the component
  }
  
  export default BurgerMenu; // export the class as a default if someone imports the component


  