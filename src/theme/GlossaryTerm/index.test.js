import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GlossaryTerm from './index';

describe('GlossaryTerm', () => {
  it('should render term text', () => {
    render(<GlossaryTerm term="API" definition="Application Programming Interface" />);

    const link = screen.getByRole('link', { name: 'API' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/glossary#api');
  });

  it('should render custom children text', () => {
    render(
      <GlossaryTerm term="API" definition="Application Programming Interface">
        Application Programming Interface
      </GlossaryTerm>
    );

    const link = screen.getByRole('link', { name: 'Application Programming Interface' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/glossary#api');
  });

  it('should show tooltip on hover', async () => {
    const user = userEvent.setup();
    render(<GlossaryTerm term="API" definition="Application Programming Interface" />);

    const link = screen.getByRole('link');
    await user.hover(link);

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveClass('tooltipVisible');
    expect(tooltip).toHaveTextContent('API Application Programming Interface');
  });

  it('should hide tooltip on mouse leave', async () => {
    const user = userEvent.setup();
    render(<GlossaryTerm term="API" definition="Application Programming Interface" />);

    const link = screen.getByRole('link');
    await user.hover(link);

    let tooltip = screen.getByRole('tooltip');
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveClass('tooltipVisible');

    await user.unhover(link);
    // Tooltip is still in DOM but hidden via CSS
    tooltip = screen.getByRole('tooltip');
    expect(tooltip).not.toHaveClass('tooltipVisible');
  });

  it('should show tooltip on focus', async () => {
    const user = userEvent.setup();
    render(<GlossaryTerm term="API" definition="Application Programming Interface" />);

    const link = screen.getByRole('link');
    await user.tab();
    expect(link).toHaveFocus();

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveClass('tooltipVisible');
  });

  it('should hide tooltip on blur', async () => {
    const user = userEvent.setup();
    render(<GlossaryTerm term="API" definition="Application Programming Interface" />);

    const link = screen.getByRole('link');
    await user.tab();
    expect(link).toHaveFocus();

    let tooltip = screen.getByRole('tooltip');
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveClass('tooltipVisible');

    await user.tab();
    // Tooltip is still in DOM but hidden via CSS
    tooltip = screen.getByRole('tooltip');
    expect(tooltip).not.toHaveClass('tooltipVisible');
  });

  it('should generate correct ID from term with spaces', () => {
    render(<GlossaryTerm term="Machine Learning" definition="A type of AI" />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/glossary#machine-learning');
  });

  it('should work without definition prop', () => {
    render(<GlossaryTerm term="TestTerm" />);

    const link = screen.getByRole('link', { name: 'TestTerm' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/glossary#testterm');

    // No tooltip should be rendered when no definition
    const tooltip = screen.queryByRole('tooltip');
    expect(tooltip).not.toBeInTheDocument();
  });

  it('should have proper ARIA attributes', () => {
    render(<GlossaryTerm term="API" definition="Application Programming Interface" />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('aria-describedby', 'tooltip-api');

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveAttribute('id', 'tooltip-api');
  });

  it('positions tooltip within viewport and adds placement classes', async () => {
    const user = userEvent.setup();
    render(<GlossaryTerm term="Edge" definition="Near the boundary of the viewport" />);

    const link = screen.getByRole('link');
    await user.hover(link);

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveClass('tooltipVisible');
    expect(tooltip).toHaveClass('tooltipFloating');
    // One of the placement classes should be present
    const hasPlacement =
      tooltip.classList.contains('tooltipTop') || tooltip.classList.contains('tooltipBottom');
    expect(hasPlacement).toBe(true);
    // Inline style should include computed top/left
    expect(tooltip.style.top).toMatch(/px$/);
    expect(tooltip.style.left).toMatch(/px$/);
  });
});
