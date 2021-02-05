import { render, waitFor } from '../../../test-utils';
import React from 'react';
import { ApolloProvider } from '@apollo/client';
import { RenderResult } from '@testing-library/react';
import { createMockClient, MockApolloClient } from 'mock-apollo-client';
import { Podcasts, ALLPODCASTS_QUERY } from '../podcasts';

describe('<Podcasts />', () => {
  let mockedClient: MockApolloClient;
  let renderResult: RenderResult;
  beforeEach(async () => {
    await waitFor(() => {
      mockedClient = createMockClient();
      const handler = () =>
        Promise.resolve({
          data: {
            getAllPodcasts: {
              __typename: 'GetAllPodcastsOutput',
              error: null,
              ok: true,
              podcasts: [
                {
                  __typename: 'Podcast',
                  id: 2,
                  title: 'pdcast',
                  category: 'podcast category',
                  thumbnailUrl: 'png',
                  description: 'description',
                  rating: 4,
                },
              ],
            },
          },
        });

      mockedClient.setRequestHandler(ALLPODCASTS_QUERY, handler);

      renderResult = render(
        <ApolloProvider client={mockedClient}>
          <Podcasts />
        </ApolloProvider>
      );
    });
  });

  it('renders OK', async () => {
    const { getByText } = renderResult;
    await waitFor(() => {
      expect(document.title).toBe('Home | Nuber-podcasts');
    });
    getByText('podcast category');
  });
});
