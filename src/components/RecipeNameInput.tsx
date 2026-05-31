import React from 'react';

interface RecipeNameInputProps {
  customName: string;
  setCustomName: (name: string) => void;
  setIsNameEdited: (edited: boolean) => void;
  onNameBlur: () => void;
}

export const RecipeNameInput: React.FC<RecipeNameInputProps> = ({
  customName,
  setCustomName,
  setIsNameEdited,
  onNameBlur,
}) => {
  return (
    <input
      type="text"
      value={customName}
      onChange={(e) => {
        setCustomName(e.target.value);
        setIsNameEdited(true);
      }}
      onBlur={onNameBlur}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          onNameBlur();
          e.currentTarget.blur();
        }
      }}
      style={{
        background: 'transparent',
        border: 'none',
        borderBottom: '1.5px dashed rgba(72, 127, 101, 0.4)',
        fontFamily: '"Cormorant Garamond", Georgia, serif',
        fontSize: '21px',
        fontWeight: 700,
        fontStyle: 'italic',
        color: 'var(--color-sweet)',
        padding: '2px 4px',
        width: '210px',
        outline: 'none',
        transition: 'all 0.2s ease',
      }}
      placeholder="Name recipe..."
      title="Click to rename recipe"
    />
  );
};
