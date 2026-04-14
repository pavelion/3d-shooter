export class InputManager {
  constructor() {
    this.keys = {};
    this.justPressed = {};
    window.addEventListener('keydown', (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      e.preventDefault();
      if (!this.keys[e.code]) this.justPressed[e.code] = true;
      this.keys[e.code] = true;
    });
    window.addEventListener('keyup', (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      e.preventDefault();
      this.keys[e.code] = false;
    });
  }

  isDown(code) { return !!this.keys[code]; }

  wasPressed(code) {
    if (this.justPressed[code]) {
      this.justPressed[code] = false;
      return true;
    }
    return false;
  }

  clearFrame() { this.justPressed = {}; }

  getGamepad(index) {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    return gamepads[index] || null;
  }
}
