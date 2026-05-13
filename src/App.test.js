import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

describe('App hover state', () => {
  it('updates city link styles on hover', () => {
    render(<App />);

    const montrealLink = screen.getByText('MONTRÉAL');
    const quebecLink = screen.getByText('QUÉBEC');

    // Initial state: not hovered
    expect(montrealLink).toHaveStyle({
      border: '1px solid rgba(212,175,55,0.6)',
      background: 'transparent',
      boxShadow: 'none',
    });

    // Hover on MONTRÉAL
    fireEvent.mouseEnter(montrealLink);

    // Now MONTRÉAL should be highlighted
    expect(montrealLink).toHaveStyle({
      border: '1px solid #D4AF37',
      background: 'rgba(212,175,55,0.15)',
      boxShadow: '0 0 12px rgba(212,175,55,0.2)',
    });
    // QUÉBEC should not be highlighted
    expect(quebecLink).toHaveStyle({
      border: '1px solid rgba(212,175,55,0.6)',
      background: 'transparent',
      boxShadow: 'none',
    });

    // Leave MONTRÉAL
    fireEvent.mouseLeave(montrealLink);

    // Reverts to original state
    expect(montrealLink).toHaveStyle({
      border: '1px solid rgba(212,175,55,0.6)',
      background: 'transparent',
      boxShadow: 'none',
    });
  });
});
