import { render, waitFor } from '../../../test-utils';
import React from 'react';
import { Episodes, GET_EPISODES_QUERY } from '../episodes';
import { ApolloProvider } from '@apollo/client';
import { getByAltText, RenderResult } from '@testing-library/react';
import { createMockClient, MockApolloClient } from 'mock-apollo-client';

const Result = {
  data: {
    getPodcast: {
      __typename: 'PodcastOutput',
      ok: true,
      error: null,
      podcast: {
        __typename: 'Podcast',
        id: 1,
        title: 'podcast title',
        category: 'category',
        thumbnailUrl: 'string/url',
        description: 'podcast description',
        rating: 4,
      },
    },
    getEpisodes: {
      __typename: 'EpisodesOutput',
      ok: true,
      error: null,
      episodes: [
        {
          __typename: 'Podcast',
          title: 'title episode',
          description: 'description',
        },
      ],
    },
  },
};

describe('<Episodes />', () => {
  let mockedClient: MockApolloClient;
  let renderResult: RenderResult;

  beforeEach(async () => {
    await waitFor(() => {
      mockedClient = createMockClient();
      const handler = () => Promise.resolve(Result);

      mockedClient.setRequestHandler(GET_EPISODES_QUERY, handler);

      renderResult = render(
        <ApolloProvider client={mockedClient}>
          <Episodes />
        </ApolloProvider>
      );
    });
  });

  it('renders OK', async () => {
    const { debug, getByText } = renderResult;
    await waitFor(() => {
      expect(document.title).toBe('Episode List | Nuber-podcasts');
    });
    getByText('podcast description');
    getByText('title episode');
  });

  afterAll(() => {
    jest.clearAllMocks();
  });
});
