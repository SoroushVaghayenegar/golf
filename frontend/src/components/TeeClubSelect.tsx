"use client";

import Select, { MultiValue, StylesConfig } from 'react-select';
import { Skeleton } from "@/components/ui/skeleton";

interface SelectOption {
  value: string;
  label: string;
  isDisabled?: boolean;
  city?: string;
}

interface TeeClubSelectProps {
  options: SelectOption[];
  selectedValues: string[];
  onChange: (selectedOptions: MultiValue<SelectOption>) => void;
  placeholder: string;
  instanceId: string;
  isLoading?: boolean;
  menuPlacement?: 'top' | 'bottom' | 'auto';
  onMenuOpen?: () => void;
}

export default function TeeClubSelect({
  options,
  selectedValues,
  onChange,
  placeholder,
  instanceId,
  isLoading = false,
  menuPlacement = 'top',
  onMenuOpen,
}: TeeClubSelectProps) {
  const selectStyles: StylesConfig<SelectOption, true> = {
    control: (provided) => ({
      ...provided,
      minHeight: '42px',
      maxHeight: '70px',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
      '&:hover': {
        borderColor: '#cbd5e0'
      },
      '&:focus-within': {
        borderColor: '#166534', // green-800
        boxShadow: '0 0 0 2px rgba(22, 101, 52, 0.1)' // green-800 with opacity
      }
    }),
    valueContainer: (provided) => ({
      ...provided,
      maxHeight: '70px',
      overflow: 'auto',
      padding: '4px 8px'
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#64748b'
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: '#166534', // green-800
      borderRadius: '4px',
      margin: '2px 4px 2px 0',
      maxWidth: 'calc(100% - 8px)'
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: 'white',
      fontSize: '12px'
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: 'white',
      '&:hover': {
        backgroundColor: '#15803d', // green-700
        color: 'white'
      }
    }),
    option: (provided, state) => ({
      ...provided,
      color: state.isDisabled ? '#9ca3af' : provided.color,
      backgroundColor: state.isDisabled 
        ? '#f9fafb' 
        : state.isSelected 
          ? '#166534' // green-800
          : state.isFocused 
            ? '#f0fdf4' // green-50
            : 'white',
      cursor: state.isDisabled ? 'not-allowed' : 'pointer',
      opacity: state.isDisabled ? 0.6 : 1,
      '&:hover': {
        backgroundColor: state.isDisabled 
          ? '#f9fafb' 
          : state.isSelected 
            ? '#166534' // green-800
            : '#f0fdf4' // green-50
      }
    })
  };

  const commonSelectProps = {
    'aria-activedescendant': '',
    inputProps: {
      'aria-activedescendant': ''
    }
  };

  const defaultMenuOpen = () => {
    // Prevent cursor from appearing on mobile
    if (window.innerWidth <= 768) {
      const input = document.querySelector(`#${instanceId} input`);
      if (input) {
        (input as HTMLInputElement).style.caretColor = 'transparent';
        (input as HTMLInputElement).style.userSelect = 'none';
      }
    }
    if (onMenuOpen) {
      onMenuOpen();
    }
  };

  if (isLoading) {
    return <Skeleton className="h-[42px] w-full rounded-lg" />;
  }

  return (
    <Select
      isMulti
      closeMenuOnSelect={false}
      options={options}
      value={options.filter(option => selectedValues.includes(option.value))}
      onChange={onChange}
      placeholder={placeholder}
      isSearchable
      noOptionsMessage={() => `No ${placeholder.toLowerCase()} found`}
      isOptionDisabled={(option) => option.isDisabled || false}
      menuPlacement={menuPlacement}
      menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
      styles={{
        ...selectStyles,
        menuPortal: (provided) => ({ ...provided, zIndex: 9999 })
      }}
      className="react-select-container"
      classNamePrefix="react-select"
      instanceId={instanceId}
      blurInputOnSelect={false}
      onMenuOpen={defaultMenuOpen}
      {...commonSelectProps}
    />
  );
}

