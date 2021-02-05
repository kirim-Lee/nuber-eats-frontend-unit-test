import React from 'react';
import { render, waitFor } from '../../test-utils';
import { ApolloProvider } from '@apollo/client';
import { RenderResult } from '@testing-library/react';
import { createMockClient, MockApolloClient } from 'mock-apollo-client';
import { CreateAccount, CREATE_ACCOUNT_MUTATION } from '../create-account';
import userEvent from '@testing-library/user-event';
import { UserRole } from '../../__type_graphql__/globalTypes';

const mockHistoryPush = jest.fn();

jest.mock('react-router-dom', () => {
  const realModule = jest.requireActual('react-router-dom');
  return {
    ...realModule,
    useHistory: () => {
      return {
        push: mockHistoryPush,
      };
    },
  };
});

describe('<CreateAccount />', () => {
  let mockedClient: MockApolloClient;
  let renderResult: RenderResult;
  beforeEach(async () => {
    await waitFor(() => {
      mockedClient = createMockClient();
      renderResult = render(
        <ApolloProvider client={mockedClient}>
          <CreateAccount />
        </ApolloProvider>
      );
    });
  });

  it('renders OK', async () => {
    await waitFor(() => {
      expect(document.title).toBe('Create Account | Nuber-podcasts');
    });
  });

  it('requires email', async () => {
    const { getByPlaceholderText, getByRole } = renderResult;
    const email = getByPlaceholderText('E-mail');
    const password = getByPlaceholderText('Password');
    const confirm = getByPlaceholderText('Confirm');

    await waitFor(() => {
      userEvent.type(email, 'ttt');
      userEvent.type(password, '1234512345');
      userEvent.type(confirm, '1234512345');
      userEvent.tab();
    });

    const patternErrorMessage = getByRole('alert');

    expect(patternErrorMessage).toHaveTextContent('Email address invalid');

    await waitFor(() => {
      userEvent.clear(email);
      userEvent.tab();
    });

    const blankErrorMessage = getByRole('alert');

    expect(blankErrorMessage).toHaveTextContent('Email is required!');
  });

  it('requres password', async () => {
    const { getByPlaceholderText, getAllByRole } = renderResult;
    const email = getByPlaceholderText('E-mail');
    const password = getByPlaceholderText('Password');
    const confirm = getByPlaceholderText('Confirm');

    await waitFor(() => {
      userEvent.type(email, 'ttt@ttt.com');
      userEvent.type(password, '1234512345');
      userEvent.clear(password);
      userEvent.type(confirm, '1234512345');
      userEvent.clear(confirm);
      userEvent.tab();
    });

    const passwordErrorMessages = getAllByRole('alert');

    expect(passwordErrorMessages[0]).toHaveTextContent('Password is required!');
    expect(passwordErrorMessages[1]).toHaveTextContent('Password is required!');

    await waitFor(() => {
      userEvent.type(password, '12345');
      userEvent.type(confirm, '1');
      userEvent.tab();
    });

    const errorMessages = getAllByRole('alert');

    expect(errorMessages[0]).toHaveTextContent(
      'Password must be more than 10 characters'
    );
    expect(errorMessages[1]).toHaveTextContent('Password not matched');
  });

  const createAccountForm = {
    email: 'ttt@ttt.com',
    password: '1234512345',
    role: UserRole.Listener,
  };

  it('create account mutation', async () => {
    const handler = jest
      .fn()
      .mockResolvedValue({ data: { createAccount: { ok: true } } });
    mockedClient.setRequestHandler(CREATE_ACCOUNT_MUTATION, handler);
    jest.spyOn(window, 'alert').mockImplementation(jest.fn());

    const { getByPlaceholderText, getByRole, getByTestId } = renderResult;
    const email = getByPlaceholderText('E-mail');
    const password = getByPlaceholderText('Password');
    const role = getByTestId('role');
    const confirm = getByPlaceholderText('Confirm');
    const submit = getByRole('button');

    await waitFor(() => {
      userEvent.type(email, createAccountForm.email);
      userEvent.type(password, createAccountForm.password);
      userEvent.type(confirm, createAccountForm.password);
      userEvent.selectOptions(role, createAccountForm.role);
      userEvent.click(submit);
    });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenLastCalledWith({
      createAccountInput: createAccountForm,
    });
    expect(window.alert).toHaveBeenCalledTimes(1);
    expect(window.alert).toHaveBeenCalledWith('Account Created! Log in now!');

    expect(mockHistoryPush).toHaveBeenCalledTimes(1);
    expect(mockHistoryPush).toHaveBeenCalledWith('/');
  });

  it('create account mutation fail', async () => {
    const handler = jest.fn().mockResolvedValue({
      data: { createAccount: { ok: false, error: 'password is not match' } },
    });
    mockedClient.setRequestHandler(CREATE_ACCOUNT_MUTATION, handler);
    jest.spyOn(window, 'alert').mockImplementation(jest.fn());

    const { getByPlaceholderText, getByRole, getByTestId } = renderResult;
    const email = getByPlaceholderText('E-mail');
    const password = getByPlaceholderText('Password');
    const role = getByTestId('role');
    const confirm = getByPlaceholderText('Confirm');
    const submit = getByRole('button');

    await waitFor(() => {
      userEvent.type(email, createAccountForm.email);
      userEvent.type(password, createAccountForm.password);
      userEvent.type(confirm, createAccountForm.password);
      userEvent.selectOptions(role, createAccountForm.role);
      userEvent.click(submit);
    });

    expect(mockHistoryPush).not.toHaveBeenCalled();
    expect(getByRole('alert')).toHaveTextContent('password is not match');
  });

  afterAll(() => {
    jest.clearAllMocks();
  });
});
