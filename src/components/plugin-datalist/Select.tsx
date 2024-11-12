import React, {
  useCallback,
  useDeferredValue,
  useEffect,
  useRef,
  useState,
} from 'react'
import { SelectContainer } from './StyledSelect'
import type { SelectProps } from './select-types'
import { useInputContext, Components } from 'leva/plugin'
import { Chevron } from 'leva/src/components/UI'
import {
  Combobox,
  Filter,
  includesValueFilter,
  useComboboxHelpers,
  useFilters,
} from 'react-datalist-input'
import './style.css'

const { Label, Row } = Components

/**
 * Internal hook used to create a ref for a state value to allow access to the state value without triggering a re-render.
 */
function useStateRef<S>(
  initialState: S,
): [S, (newState: S) => void, React.MutableRefObject<S>] {
  const [state, setState] = useState(initialState)
  const ref = useRef(initialState)
  const setStateRef = (newState: S) => {
    setState(newState)
    ref.current = newState
  }
  return [state, setStateRef, ref]
}

export function SelectComponent() {
  const { label, value, onUpdate, id, disabled, settings } =
    useInputContext<SelectProps>()

  const { options } = settings

  const [internalIsExpanded, setInternalIsExpanded, isExpandedRef] =
    useStateRef(false)

  const [internalValue, setInternalValue] = useState(value)
  const debounceValue = useDeferredValue(internalValue)

  const [filteredItems, filteredItemsRef] = useFilters(options, debounceValue, [
    (items, value) =>
      items.filter((item) => {
        if (typeof item === 'string') {
          return includesValueFilter([item], value)
        } else if (item.value.name) {
          return item.value.name
            .toLocaleLowerCase()
            .includes(String(value).toLocaleLowerCase())
        }
        return false
      }),
  ])
  const listboxRef = useRef<HTMLUListElement>(null)
  const comboboxInputRef = useRef<HTMLInputElement>(null)

  const {
    handleClickOutside,
    handleFocusOutside,
    closeOnEscape,
    handleChange,
    expandOnFocus,
    handleSelect,
    handleKeyDownOnInput,
    handleKeyDownOnListboxOption,
  } = useComboboxHelpers({
    listboxRef,
    comboboxInputRef,
    isExpandedRef,
    setValue: setInternalValue,
    onSelect: onUpdate,
    itemsRef: filteredItemsRef,
    setIsExpanded: setInternalIsExpanded,
  })

  useEffect(() => {
    // separate useEffect so we don't re-run it twice with each dependency change
    window.addEventListener('click', handleClickOutside)
    window.addEventListener('keyup', closeOnEscape)
    return () => {
      window.removeEventListener('click', handleClickOutside)
      window.removeEventListener('keyup', closeOnEscape)
    }
  }, [handleClickOutside, closeOnEscape])

  useEffect(() => {
    // separate useEffect so we don't re-run it twice with each dependency change
    window.addEventListener('focusin', handleFocusOutside)
    return () => {
      window.removeEventListener('focusin', handleFocusOutside)
    }
  }, [handleFocusOutside])

  console.log('Render ', internalValue)

  return (
    <Combobox
      // selectedItemId={internalSelectedItem?.id}
      isExpanded={internalIsExpanded}
      currentInputValue={internalValue.label}
    >
      <Row input>
        <Label>{label}</Label>
        <SelectContainer>
          <Combobox.ComboboxInput
            id={id}
            disabled={disabled}
            className="leva-c-fOquTv"
            ref={comboboxInputRef}
            value={internalValue.label ?? internalValue ?? ''}
            onClick={expandOnFocus}
            onFocus={expandOnFocus}
            onChange={handleChange}
            onKeyDown={handleKeyDownOnInput}
          />
          <Chevron toggled />
        </SelectContainer>
      </Row>
      {filteredItems.length && internalIsExpanded ? (
        <Row className={'leva-select-datalist-listbox-container'}>
          <Combobox.Listbox
            ref={listboxRef}
            aria-hidden={internalIsExpanded}
            className={'leva-select-datalist-listbox'}
          >
            {filteredItems.map((item) => (
              <Combobox.ListboxOption
                aria-label={item.label || item.value}
                key={item.id}
                id={item.id}
                tabIndex={-1}
                onClick={() => handleSelect({ label: item.name, value: item })}
                onKeyDown={handleKeyDownOnListboxOption}
                className={'leva-select-datalist-entry'}
              >
                <Combobox.Highlight
                  currentInput={internalValue.label ?? internalValue ?? ''}
                >
                  {item.label || item}
                </Combobox.Highlight>
              </Combobox.ListboxOption>
            ))}
          </Combobox.Listbox>
        </Row>
      ) : null}
    </Combobox>
  )
}
