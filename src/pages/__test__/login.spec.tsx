import { render, waitFor } from '../../test-utils';
import React from 'react';
import { ApolloProvider } from '@apollo/client';
import { RenderResult } from '@testing-library/react';
import { createMockClient, MockApolloClient } from 'mock-apollo-client';
import { Login, LOGIN_MUTATION } from '../login';
import userEvent from '@testing-library/user-event';
import { LS_TOKEN } from '../../constants';

describe('<Login />', () => {
  let mockedClient: MockApolloClient;
  let renderResult: RenderResult;

  beforeEach(async () => {
    await waitFor(() => {
      mockedClient = createMockClient();
      renderResult = render(
        <ApolloProvider client={mockedClient}>
          <Login />
        </ApolloProvider>
      );
    });
  });

  it('renders OK', async () => {
    await waitFor(() => {
      expect(document.title).toBe('Log In | Nuber-podcasts');
    });
  });

  it('requires email', async () => {
    const { getByPlaceholderText, getByRole } = renderResult;
    const email = getByPlaceholderText('E-mail');

    await waitFor(() => {
      userEvent.type(email, 'ttt@ttt.com');
      userEvent.clear(email);
    });

    const errorMessage = getByRole('alert');

    expect(errorMessage).toHaveTextContent('Email is required!');
  });

  it('requires password', async () => {
    const handler = jest.fn();
    mockedClient.setRequestHandler(LOGIN_MUTATION, handler);
    const { getByPlaceholderText, getByRole } = renderResult;
    const email = getByPlaceholderText('E-mail');
    const password = getByPlaceholderText('Password');

    const submit = getByRole('button');

    await waitFor(() => {
      userEvent.type(password, 'min_10');
    });

    const minErrorMessage = getByRole('alert');
    expect(minErrorMessage).toHaveTextContent(
      'Password must be more than 10 characters'
    );

    await waitFor(() => {
      userEvent.type(email, 'ttt@ttt.com');
      userEvent.clear(password);
      userEvent.click(submit);
    });

    const requireErrorMessage = getByRole('alert');
    expect(requireErrorMessage).toHaveTextContent('Password is required!');
    expect(handler).not.toHaveBeenCalledTimes(1);
  });

  const formInput = {
    email: 'ttt@ttt.com',
    password: '12345678901',
  };

  it('mutation login', async () => {
    const handler = jest.fn().mockResolvedValue({
      data: {
        login: { ok: true, token: 'token string' },
      },
    });

    mockedClient.setRequestHandler(LOGIN_MUTATION, handler);

    jest.spyOn(Storage.prototype, 'setItem');

    const { getByPlaceholderText, getByRole } = renderResult;
    const password = getByPlaceholderText('Password');
    const email = getByPlaceholderText('E-mail');
    const submit = getByRole('button');

    await waitFor(() => {
      userEvent.type(email, formInput.email);
      userEvent.type(password, formInput.password);
      userEvent.click(submit);
    });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ loginInput: formInput });

    expect(localStorage.setItem).toBeCalledTimes(1);
    expect(localStorage.setItem).toHaveBeenCalledWith(LS_TOKEN, 'token string');
  });

  it('mutation login error', async () => {
    const handler = jest.fn().mockResolvedValue({
      data: {
        login: { ok: false, error: 'mutation error' },
      },
    });

    mockedClient.setRequestHandler(LOGIN_MUTATION, handler);

    jest.spyOn(Storage.prototype, 'setItem');

    const { getByPlaceholderText, getByRole } = renderResult;
    const password = getByPlaceholderText('Password');
    const email = getByPlaceholderText('E-mail');
    const submit = getByRole('button');

    await waitFor(() => {
      userEvent.type(email, formInput.email);
      userEvent.type(password, formInput.password);
      userEvent.click(submit);
    });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ loginInput: formInput });

    expect(localStorage.setItem).not.toBeCalled();

    expect(getByRole('alert')).toHaveTextContent('mutation error');
  });
});
