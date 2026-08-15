import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import Auth from './Auth';

jest.mock('../lib/supabaseClient', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
    },
  },
}));

describe('Auth', () => {
  let container;
  let root;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('shows a validation message when required fields are empty', () => {
    act(() => {
      root.render(<Auth onAuth={jest.fn()} />);
    });

    const submit = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent.includes('CONNEXION')
    );
    act(() => {
      submit.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container.textContent).toContain('Remplis tous les champs.');
  });
});
