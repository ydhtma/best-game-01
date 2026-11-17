// Lumen Keep — keyboard and mouse input.
// One clear job: turn DOM events into a plain input snapshot the simulation
// reads each step. The simulation never touches the DOM itself, which is
// what lets the screenshot autopilot drive the same code headlessly.
export function createInput(canvas) {
  const input = {
    up: false,
    down: false,
    left: false,
    right: false,
    fire: false,
    dash: false,
    mouseX: 640,
    mouseY: 300,
    mouseDown: false,
    // Edge-triggered presses, consumed by the game loop once each.
    pressed: new Set(),
  };

  const keyMap = {
    KeyW: 'up',
    ArrowUp: 'up',
    KeyS: 'down',
    ArrowDown: 'down',
    KeyA: 'left',
    ArrowLeft: 'left',
    KeyD: 'right',
    ArrowRight: 'right',
    Space: 'fire',
  };

  function canvasPos(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = 1280 / rect.width;
    const scaleY = 800 / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const field = keyMap[event.code];
    if (field) {
      input[field] = true;
      if (event.code === 'Space') event.preventDefault();
    }
    if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') input.dash = true;
    input.pressed.add(event.code);
  });
  window.addEventListener('keyup', (event) => {
    const field = keyMap[event.code];
    if (field) input[field] = false;
    if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') input.dash = false;
  });
  canvas.addEventListener('mousemove', (event) => {
    const p = canvasPos(event);
    input.mouseX = p.x;
    input.mouseY = p.y;
  });
  canvas.addEventListener('mousedown', (event) => {
    if (event.button !== 0) return;
    const p = canvasPos(event);
    input.mouseX = p.x;
    input.mouseY = p.y;
    input.mouseDown = true;
    input.fire = true;
    input.pressed.add('MouseLeft');
  });
  window.addEventListener('mouseup', (event) => {
    if (event.button !== 0) return;
    input.mouseDown = false;
    if (!input.pressed.has('Space')) input.fire = false;
  });
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());

  input.consume = (code) => {
    if (!input.pressed.has(code)) return false;
    input.pressed.delete(code);
    return true;
  };
  input.endFrame = () => input.pressed.clear();
  return input;
}

// A scripted input for the screenshot autopilot: same shape, no DOM.
export function createScriptedInput() {
  return {
    up: false,
    down: false,
    left: false,
    right: false,
    fire: false,
    dash: false,
    mouseX: 640,
    mouseY: 300,
    mouseDown: false,
    pressed: new Set(),
    consume: () => false,
    endFrame: () => {},
  };
}
