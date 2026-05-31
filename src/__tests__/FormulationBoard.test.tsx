// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { FormulationBoard } from '../components/FormulationBoard';
import { Ingredient } from '../types';

describe('FormulationBoard HUD Component', () => {
  let container: HTMLDivElement;

  const mockIngredients: Ingredient[] = [
    {
      name: 'Tomato',
      coords: [1, 2, 3],
      sensory: [0.8, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    },
    {
      name: 'Basil',
      coords: [4, 5, 6],
      sensory: [0, 0.7, 0, 0, 0, 0, 0, 0, 0, 0]
    },
    {
      name: 'Sugar',
      coords: [-1, -2, -3],
      sensory: [0.9, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    }
  ];

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should render recipe name input and trigger onNameBlur', () => {
    const setCustomName = vi.fn();
    const setIsNameEdited = vi.fn();
    const onNameBlur = vi.fn();

    const root = createRoot(container);
    act(() => {
      root.render(
        <FormulationBoard
          positives={[]}
          negatives={[]}
          ingredients={mockIngredients}
          onAddPositive={vi.fn()}
          onRemovePositive={vi.fn()}
          onAddNegative={vi.fn()}
          onRemoveNegative={vi.fn()}
          workerState="ready"
          workerError={null}
          customName="My Magic Elixir"
          setCustomName={setCustomName}
          setIsNameEdited={setIsNameEdited}
          onNameBlur={onNameBlur}
        />
      );
    });

    const nameInput = container.querySelector('input[type="text"]') as HTMLInputElement;
    expect(nameInput).toBeDefined();
    expect(nameInput.value).toBe('My Magic Elixir');

    // Simulate typing utilizing HTMLInputElement prototype value setter to bypass React's tracking
    act(() => {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      )?.set;
      nativeInputValueSetter?.call(nameInput, 'New Elixir Name');
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));
    });
    expect(setCustomName).toHaveBeenCalledWith('New Elixir Name');
    expect(setIsNameEdited).toHaveBeenCalledWith(true);

    // Simulate blur by focusing and blurring the element
    act(() => {
      nameInput.focus();
      nameInput.blur();
    });
    expect(onNameBlur).toHaveBeenCalled();
  });

  it('should render active positive and negative ingredient chips and support deletion click', () => {
    const onRemovePositive = vi.fn();
    const onRemoveNegative = vi.fn();

    const root = createRoot(container);
    act(() => {
      root.render(
        <FormulationBoard
          positives={[0]} // Tomato
          negatives={[2]} // Sugar
          ingredients={mockIngredients}
          onAddPositive={vi.fn()}
          onRemovePositive={onRemovePositive}
          onAddNegative={vi.fn()}
          onRemoveNegative={onRemoveNegative}
          workerState="ready"
          workerError={null}
          customName="Recipe"
          setCustomName={vi.fn()}
          setIsNameEdited={vi.fn()}
          onNameBlur={vi.fn()}
        />
      );
    });

    // Check Tomato chip is rendered
    const posChips = container.querySelectorAll('.ingredient-chip.positive');
    expect(posChips.length).toBe(1);
    expect(posChips[0].textContent).toContain('Tomato');

    // Check Sugar chip is rendered
    const negChips = container.querySelectorAll('.ingredient-chip.negative');
    expect(negChips.length).toBe(1);
    expect(negChips[0].textContent).toContain('Sugar');

    // Trigger delete on Tomato chip
    const deleteButton = posChips[0].querySelector('.chip-remove-btn') as HTMLButtonElement;
    expect(deleteButton).toBeDefined();
    act(() => {
      deleteButton.click();
    });
    expect(onRemovePositive).toHaveBeenCalledWith(0);
  });

  it('should trigger onRemovePositive when Backspace is pressed on empty positive input', () => {
    const onRemovePositive = vi.fn();

    const root = createRoot(container);
    act(() => {
      root.render(
        <FormulationBoard
          positives={[0, 1]} // Tomato, Basil
          negatives={[]}
          ingredients={mockIngredients}
          onAddPositive={vi.fn()}
          onRemovePositive={onRemovePositive}
          onAddNegative={vi.fn()}
          onRemoveNegative={vi.fn()}
          workerState="ready"
          workerError={null}
          customName="Recipe"
          setCustomName={vi.fn()}
          setIsNameEdited={vi.fn()}
          onNameBlur={vi.fn()}
        />
      );
    });

    const inputs = container.querySelectorAll('.inline-equation-input') as NodeListOf<HTMLInputElement>;
    const posInput = inputs[0]; // first input is positive

    // Press backspace on empty input
    act(() => {
      posInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));
    });

    // Should remove the last item in positives, which is 1 (Basil)
    expect(onRemovePositive).toHaveBeenCalledWith(1);
  });
});
