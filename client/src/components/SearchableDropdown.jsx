import React, { useState, useEffect, useRef } from 'react';

const SearchableDropdown = ({ options, value, onChange, placeholder }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState(options);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null); // Ref for the search input

  const getSelectedOptionLabel = () => {
    const selectedOption = options.find(option => option.value === value);
    return selectedOption ? selectedOption.label : (placeholder || 'Select...');
  };

  useEffect(() => {
    setFilteredOptions(
      options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, options]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    if (!isOpen) {
        setIsOpen(true); // Open dropdown when user starts typing
    }
  };

  const handleOptionClick = (optionValue) => {
    onChange(optionValue);
    setSearchTerm(''); // Clear search term on selection
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen && inputRef.current) {
        // Optional: focus input when opening via button if desired
        // inputRef.current.focus(); 
    }
  };

  return (
    <div className="relative w-full max-w-md" ref={dropdownRef}>
      <div className="flex h-12 bg-base-300 rounded-md">
        {/* Selected Value Display Button */}
        <button 
          type="button"
          className="flex items-center justify-between px-4 py-2 bg-base-300 text-base-content rounded-l-md hover:bg-base-content hover:bg-opacity-10 focus:outline-none w-2/5 min-w-[100px] truncate"
          onClick={toggleDropdown}
        >
          <span className="truncate pr-1">{getSelectedOptionLabel()}</span>
          <svg className="w-4 h-4 fill-current opacity-50 shrink-0" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </button>

        {/* Search Input */}
        <input
          ref={inputRef}
          type="text"
          className="w-3/5 px-4 py-2 bg-base-300 text-base-content rounded-r-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder-base-content placeholder-opacity-50 h-full"
          placeholder={placeholder || 'Search...'}
          value={searchTerm}
          onChange={handleInputChange}
          onClick={() => !isOpen && setIsOpen(true)} // Open dropdown on click if not already open
        />
      </div>

      {isOpen && (
        <ul className="absolute z-10 w-full mt-1 bg-base-200 border border-base-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <li
                key={option.value}
                className={`px-4 py-2 cursor-pointer hover:bg-primary hover:text-primary-content ${option.value === value ? 'bg-primary text-primary-content' : ''}`}
                onClick={() => handleOptionClick(option.value)}
              >
                {option.label}
              </li>
            ))
          ) : (
            <div className="px-4 py-2 text-base-content text-opacity-70">
              {searchTerm ? 'No results found.' : 'Type to search...'}
            </div>
          )}
        </ul>
      )}
    </div>
  );
};

export default SearchableDropdown; 