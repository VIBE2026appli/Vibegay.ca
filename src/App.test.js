import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

describe('App Component', () => {
  it('renders the main title', () => {
    render(<App />);
    const titleElement = screen.getByText(/V I B E/i);
    expect(titleElement).toBeInTheDocument();
  });

  it('renders the city links with correct href attributes', () => {
    render(<App />);

    const montrealLink = screen.getByText('MONTRÉAL');
    expect(montrealLink).toBeInTheDocument();
    expect(montrealLink).toHaveAttribute('href', 'https://vibegay.ca/montreal');

    const quebecLink = screen.getByText('QUÉBEC');
    expect(quebecLink).toBeInTheDocument();
    expect(quebecLink).toHaveAttribute('href', 'https://vibegay.ca/quebec');

    const ottawaLink = screen.getByText('OTTAWA');
    expect(ottawaLink).toBeInTheDocument();
    expect(ottawaLink).toHaveAttribute('href', 'https://vibegay.ca/ottawa');

    const torontoLink = screen.getByText('TORONTO');
    expect(torontoLink).toBeInTheDocument();
    expect(torontoLink).toHaveAttribute('href', 'https://vibegay.ca/toronto');
  });

  it('allows user to type in the "Votre Prénom" input', () => {
    render(<App />);
    const inputElement = screen.getByPlaceholderText('Votre Prénom');

    expect(inputElement).toBeInTheDocument();
    expect(inputElement.value).toBe('');

    fireEvent.change(inputElement, { target: { value: 'John' } });

    expect(inputElement.value).toBe('John');
  });

  it('changes style when hovering over a city link', () => {
    render(<App />);
    const montrealLink = screen.getByText('MONTRÉAL');

    // Initial style
    expect(montrealLink).toHaveStyle({ background: 'transparent' });

    // Hover style
    fireEvent.mouseEnter(montrealLink);
    expect(montrealLink).toHaveStyle({ background: 'rgba(212,175,55,0.15)' });

    // Unhover style
    fireEvent.mouseLeave(montrealLink);
    expect(montrealLink).toHaveStyle({ background: 'transparent' });
  });
});
