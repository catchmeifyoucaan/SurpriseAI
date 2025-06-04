
import React, { useRef, useState, useEffect } from 'react';
import { FileInputProps } from '../../types'; 
import Button from './Button'; 

const FileInput: React.FC<FileInputProps> = ({
  label,
  id,
  error,
  wrapperClassName = '',
  buttonText = 'Choose File',
  onFileSelect,
  accept,
  multiple,
  currentValue, // New prop
  ...props 
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [displayFileName, setDisplayFileName] = useState<string>('');

  useEffect(() => {
    if (typeof currentValue === 'string') {
      setDisplayFileName(currentValue);
    } else if (currentValue instanceof File) {
      setDisplayFileName(currentValue.name);
    } else {
      setDisplayFileName('');
    }
  }, [currentValue]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null;
    if (file) {
      setDisplayFileName(file.name);
      onFileSelect(file);
    } else {
      // If user cancels file selection after a file was already there, 
      // and it wasn't an AI string, then clear.
      if (!(typeof currentValue === 'string')) {
        setDisplayFileName('');
        onFileSelect(null);
      }
    }
  };

  const handleButtonClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className={wrapperClassName}>
      {label && (
        <label htmlFor={id || props.name} className="block text-sm font-medium text-text-secondary mb-1">
          {label}
        </label>
      )}
      <div className="flex items-center space-x-2">
        <Button type="button" variant="secondary" onClick={handleButtonClick} size="md">
          {buttonText}
        </Button>
        <input
          type="file"
          id={id || props.name}
          ref={inputRef}
          className="hidden"
          onChange={handleFileChange}
          accept={accept}
          multiple={multiple}
          {...props}
        />
        <span className={`text-sm text-text-secondary truncate ${displayFileName ? 'opacity-100' : 'opacity-70'}`}>
          {displayFileName || 'No file chosen'}
        </span>
      </div>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
};

export default FileInput;
