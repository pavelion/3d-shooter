export class TouchControls {
  constructor() {
    this.moveX = 0;
    this.moveZ = 0;
    this.jumpPressed = false;
    this.shootPressed = false;
    this.active = false;

    // Joystick state
    this._joystickTouchId = null;
    this._joystickOrigin = { x: 0, y: 0 };
    this._joystickCurrent = { x: 0, y: 0 };
    this._joystickRadius = 50;

    // Button touch IDs
    this._jumpTouchId = null;
    this._shootTouchId = null;

    this._createUI();
    this._bindEvents();

    // Auto-show on touch devices
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      this.show();
    }
  }

  _createUI() {
    // Container
    this.container = document.createElement('div');
    this.container.id = 'touchControls';
    this.container.style.cssText = `
      display: none;
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100%;
      z-index: 8;
      pointer-events: none;
    `;

    // Joystick area (left side)
    this.joystickArea = document.createElement('div');
    this.joystickArea.style.cssText = `
      position: absolute;
      left: 10px; bottom: 10px;
      width: 180px; height: 180px;
      pointer-events: auto;
      touch-action: none;
    `;

    // Joystick base (outer ring)
    this.joystickBase = document.createElement('div');
    this.joystickBase.style.cssText = `
      position: absolute;
      left: 50%; top: 50%;
      transform: translate(-50%, -50%);
      width: 130px; height: 130px;
      border-radius: 50%;
      background: rgba(255,255,255,0.1);
      border: 3px solid rgba(255,255,255,0.3);
    `;

    // Joystick knob (inner circle)
    this.joystickKnob = document.createElement('div');
    this.joystickKnob.style.cssText = `
      position: absolute;
      left: 50%; top: 50%;
      transform: translate(-50%, -50%);
      width: 50px; height: 50px;
      border-radius: 50%;
      background: rgba(255,255,255,0.5);
      border: 2px solid rgba(255,255,255,0.7);
      transition: none;
    `;

    this.joystickBase.appendChild(this.joystickKnob);
    this.joystickArea.appendChild(this.joystickBase);
    this.container.appendChild(this.joystickArea);

    // Buttons area (right side)
    const btnStyle = (bottom, right, color, label) => {
      const btn = document.createElement('div');
      btn.style.cssText = `
        position: absolute;
        bottom: ${bottom}px; right: ${right}px;
        width: 70px; height: 70px;
        border-radius: 50%;
        background: rgba(${color}, 0.25);
        border: 3px solid rgba(${color}, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Press Start 2P', monospace;
        font-size: 0.45rem;
        color: rgba(255,255,255,0.8);
        pointer-events: auto;
        touch-action: none;
        user-select: none;
        -webkit-user-select: none;
      `;
      btn.textContent = label;
      return btn;
    };

    // Shoot button (larger, bottom-right)
    this.shootBtn = btnStyle(20, 20, '255,60,60', 'FIRE');
    this.shootBtn.style.width = '80px';
    this.shootBtn.style.height = '80px';
    this.container.appendChild(this.shootBtn);

    // Jump button (above shoot)
    this.jumpBtn = btnStyle(115, 30, '60,160,255', 'JUMP');
    this.container.appendChild(this.jumpBtn);

    document.body.appendChild(this.container);
  }

  _bindEvents() {
    // Joystick touch handling
    this.joystickArea.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (this._joystickTouchId !== null) return;
      const touch = e.changedTouches[0];
      this._joystickTouchId = touch.identifier;
      const rect = this.joystickBase.getBoundingClientRect();
      this._joystickOrigin.x = rect.left + rect.width / 2;
      this._joystickOrigin.y = rect.top + rect.height / 2;
      this._updateJoystick(touch.clientX, touch.clientY);
    }, { passive: false });

    this.joystickArea.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (const touch of e.changedTouches) {
        if (touch.identifier === this._joystickTouchId) {
          this._updateJoystick(touch.clientX, touch.clientY);
        }
      }
    }, { passive: false });

    const joystickEnd = (e) => {
      for (const touch of e.changedTouches) {
        if (touch.identifier === this._joystickTouchId) {
          this._joystickTouchId = null;
          this.moveX = 0;
          this.moveZ = 0;
          this.joystickKnob.style.transform = 'translate(-50%, -50%)';
        }
      }
    };
    this.joystickArea.addEventListener('touchend', joystickEnd, { passive: false });
    this.joystickArea.addEventListener('touchcancel', joystickEnd, { passive: false });

    // Jump button
    this.jumpBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this._jumpTouchId = e.changedTouches[0].identifier;
      this.jumpPressed = true;
      this.jumpBtn.style.background = 'rgba(60,160,255,0.5)';
    }, { passive: false });

    const jumpEnd = (e) => {
      for (const touch of e.changedTouches) {
        if (touch.identifier === this._jumpTouchId) {
          this._jumpTouchId = null;
          this.jumpPressed = false;
          this.jumpBtn.style.background = 'rgba(60,160,255,0.25)';
        }
      }
    };
    this.jumpBtn.addEventListener('touchend', jumpEnd, { passive: false });
    this.jumpBtn.addEventListener('touchcancel', jumpEnd, { passive: false });

    // Shoot button
    this.shootBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this._shootTouchId = e.changedTouches[0].identifier;
      this.shootPressed = true;
      this.shootBtn.style.background = 'rgba(255,60,60,0.5)';
    }, { passive: false });

    const shootEnd = (e) => {
      for (const touch of e.changedTouches) {
        if (touch.identifier === this._shootTouchId) {
          this._shootTouchId = null;
          this.shootPressed = false;
          this.shootBtn.style.background = 'rgba(255,60,60,0.25)';
        }
      }
    };
    this.shootBtn.addEventListener('touchend', shootEnd, { passive: false });
    this.shootBtn.addEventListener('touchcancel', shootEnd, { passive: false });
  }

  _updateJoystick(clientX, clientY) {
    let dx = clientX - this._joystickOrigin.x;
    let dy = clientY - this._joystickOrigin.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = this._joystickRadius;

    if (dist > maxDist) {
      dx = (dx / dist) * maxDist;
      dy = (dy / dist) * maxDist;
    }

    // Position the knob
    this.joystickKnob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;

    // Normalize to -1..1 with deadzone
    const deadzone = 0.15;
    const normX = dx / maxDist;
    const normY = dy / maxDist;

    this.moveX = Math.abs(normX) > deadzone ? normX : 0;
    // Touch Y-axis: down is positive in screen coords, but we want down=positive Z (toward camera)
    this.moveZ = Math.abs(normY) > deadzone ? normY : 0;
  }

  show() {
    this.active = true;
    this.container.style.display = 'block';
  }

  hide() {
    this.active = false;
    this.container.style.display = 'none';
  }
}
