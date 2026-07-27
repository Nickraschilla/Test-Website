import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';

let mockSocialsData;
let mockInstagramData;
let mockMetaAdsData;

jest.mock('./hooks/useReelsData', () => ({
  useReelsData: () => mockSocialsData || ({
    reels: [],
    loading: false,
    refreshing: false,
    error: '',
  }),
  useInstagramData: () => mockInstagramData || ({
    reels: [],
    loading: false,
    refreshing: false,
    error: '',
  }),
}));

jest.mock('./hooks/useMetaAdsData', () => ({
  useMetaAdsData: () => mockMetaAdsData || ({
    rows: [],
    loading: false,
    refreshing: false,
    error: '',
    usingFallback: false,
  }),
}));

beforeEach(() => {
  window.localStorage.clear();
  mockSocialsData = {
    reels: [],
    loading: false,
    refreshing: false,
    error: '',
  };
  mockInstagramData = {
    reels: [],
    loading: false,
    refreshing: false,
    error: '',
  };
  mockMetaAdsData = {
    rows: [
      {
        id: 'campaign-1',
        reportingStarts: '2026-07-01',
        reportingEnds: '2026-07-01',
        campaignId: 'cmp_active',
        campaignName: 'Meta Test Campaign',
        campaignDelivery: 'Active',
        campaignObjective: 'Leads',
        results: 12,
        resultIndicator: 'Meta leads',
        costPerResult: 10,
        amountSpent: 120,
        impressions: 1000,
        reach: 800,
      },
      {
        id: 'campaign-1-day-2',
        reportingStarts: '2026-07-02',
        reportingEnds: '2026-07-02',
        campaignId: 'cmp_active',
        campaignName: 'Meta Test Campaign',
        campaignDelivery: 'Active',
        campaignObjective: 'Leads',
        results: 6,
        resultIndicator: 'Meta leads',
        amountSpent: 60,
        impressions: 500,
        reach: 400,
      },
      {
        id: 'campaign-2',
        reportingStarts: '2026-07-03',
        reportingEnds: '2026-07-03',
        campaignId: 'cmp_ended',
        campaignName: 'Ended Meta Campaign',
        campaignDelivery: 'Ended',
        campaignObjective: 'Leads',
        results: 3,
        resultIndicator: 'Meta leads',
        amountSpent: 150,
        impressions: 800,
        reach: 500,
      },
    ],
    loading: false,
    refreshing: false,
    error: '',
    usingFallback: false,
  };
});

test('renders the reporting dashboard tabs', () => {
  render(<App />);
  expect(
    screen.getByRole('heading', { name: /instagram reporting/i })
  ).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /socials reporting leaderboard/i }));

  expect(
    screen.getByText(/board totals/i)
  ).toBeInTheDocument();
  expect(
    screen.getByRole('heading', { name: /live leaderboard/i })
  ).toBeInTheDocument();

  expect(screen.queryByRole('button', { name: 'Total' })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Facebook' })).toHaveAttribute(
    'aria-pressed',
    'false'
  );

  fireEvent.click(screen.getByRole('button', { name: 'Facebook' }));

  expect(screen.getByRole('button', { name: 'Facebook' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );

  fireEvent.click(screen.getByRole('button', { name: 'Instagram' }));

  expect(screen.getByRole('button', { name: 'Facebook' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  expect(screen.getByRole('button', { name: 'Instagram' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
});

test('opens the Meta Ads Reporting tab', () => {
  render(<App />);

  fireEvent.click(screen.getByRole('button', { name: /meta ads reporting paid campaigns/i }));

  expect(
    screen.getByRole('heading', { name: /meta ads reporting/i })
  ).toBeInTheDocument();
  expect(screen.getByText(/campaign review, lead quality and practical performance analysis/i)).toBeInTheDocument();
  expect(screen.getByRole('combobox', { name: /^campaign$/i })).toHaveValue('cmp_active');
  expect(screen.queryByText(/campaign score/i)).not.toBeInTheDocument();
  expect(screen.getByText(/performance over time/i)).toBeInTheDocument();
  expect(screen.getByText(/campaign comparison/i)).toBeInTheDocument();
  expect(screen.getByText(/lead pipeline/i)).toBeInTheDocument();
  expect(screen.getByText(/key takeaways/i)).toBeInTheDocument();
  expect(screen.getAllByText('$180.00').length).toBeGreaterThan(0);
  expect(screen.getAllByText('18').length).toBeGreaterThan(0);
});

test('switches Meta Ads campaign from the dropdown and comparison table', () => {
  render(<App />);

  fireEvent.click(screen.getByRole('button', { name: /meta ads reporting paid campaigns/i }));
  fireEvent.change(screen.getByRole('combobox', { name: /^campaign$/i }), {
    target: { value: 'cmp_ended' },
  });

  expect(screen.getByRole('combobox', { name: /^campaign$/i })).toHaveValue('cmp_ended');
  expect(screen.getAllByText('$150.00').length).toBeGreaterThan(0);

  fireEvent.click(screen.getByRole('cell', { name: 'Meta Test Campaign' }));

  expect(screen.getByRole('combobox', { name: /^campaign$/i })).toHaveValue('cmp_active');
});

test('adds and edits a manual Meta Ads lead for the selected campaign', () => {
  render(<App />);

  fireEvent.click(screen.getByRole('button', { name: /meta ads reporting paid campaigns/i }));
  fireEvent.change(screen.getByLabelText(/lead name/i), { target: { value: 'Test Lead' } });
  fireEvent.change(screen.getByLabelText(/lead status/i), { target: { value: 'Converted' } });
  fireEvent.click(screen.getByRole('button', { name: /add lead/i }));

  expect(screen.getByDisplayValue('Test Lead')).toBeInTheDocument();
  expect(screen.getAllByText(/100\.00%/i).length).toBeGreaterThan(0);

  fireEvent.change(screen.getByLabelText(/notes for test lead/i), { target: { value: 'Good quality' } });
  expect(screen.getByDisplayValue('Good quality')).toBeInTheDocument();
});

test('uses Instagram loading state for the default page', () => {
  mockSocialsData.loading = false;
  mockInstagramData.loading = true;

  render(<App />);

  expect(screen.getByRole('status')).toHaveTextContent(/syncing live data/i);
});

test('shows only the active tab error message', () => {
  mockSocialsData.error = 'Could not load Socials Reporting data.';
  mockInstagramData.error = '';

  render(<App />);

  expect(screen.queryByRole('alert')).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /socials reporting leaderboard/i }));

  expect(screen.getByRole('alert')).toHaveTextContent(/could not load socials reporting data/i);
});
