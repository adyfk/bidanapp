'use client';

import { useEffect, useState } from 'react';
import { ProfessionalAccessScreen } from '@/components/screens/ProfessionalAccessScreen';
import { ProfessionalPageSkeleton } from '@/components/screens/ProfessionalPageSkeleton';
import { ProfessionalSetupScreen } from '@/components/screens/ProfessionalSetupScreen';
import { buildOutcomes, toGalleryDraft, toPortfolioDraft } from '@/components/screens/professional-dashboard/helpers';
import { ProfessionalDashboardGalleryEditorDialog } from '@/components/screens/professional-dashboard/ProfessionalDashboardGalleryEditorDialog';
import { ProfessionalDashboardPortfolioEditorDialog } from '@/components/screens/professional-dashboard/ProfessionalDashboardPortfolioEditorDialog';
import { ProfessionalDashboardPortfolioTab } from '@/components/screens/professional-dashboard/ProfessionalDashboardPortfolioTab';
import { ProfessionalDashboardShell } from '@/components/screens/professional-dashboard/ProfessionalDashboardShell';
import type { GalleryDraft, PortfolioDraft } from '@/components/screens/professional-dashboard/types';
import { useDashboardDialogLifecycle } from '@/components/screens/professional-dashboard/useDashboardDialogLifecycle';
import { useProfessionalDashboardPageData } from '@/components/screens/professional-dashboard/useProfessionalDashboardPageData';

export const ProfessionalDashboardPortfolioScreen = () => {
  const {
    activeCoverageAreas,
    activeProfessional,
    activeServiceConfigurations,
    averageServicePriceLabel,
    clampedCompletionScore,
    createGalleryItem,
    createPortfolioEntry,
    dashboardLocationLabel,
    deleteGalleryItem,
    deletePortfolioEntry,
    getServiceLabel,
    hasMounted,
    isProfessional,
    portalState,
    publicPortfolioEntries,
    saveGalleryItem,
    savePortfolioEntry,
    t,
  } = useProfessionalDashboardPageData();
  const [notice, setNotice] = useState<string | null>(null);
  const [isPortfolioEditorOpen, setIsPortfolioEditorOpen] = useState(false);
  const [isGalleryEditorOpen, setIsGalleryEditorOpen] = useState(false);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState(portalState.portfolioEntries[0]?.id || '');
  const [selectedGalleryId, setSelectedGalleryId] = useState(portalState.galleryItems[0]?.id || '');
  const [portfolioDraft, setPortfolioDraft] = useState<PortfolioDraft | null>(
    portalState.portfolioEntries[0] ? toPortfolioDraft(portalState.portfolioEntries[0]) : null,
  );
  const [galleryDraft, setGalleryDraft] = useState<GalleryDraft | null>(
    portalState.galleryItems[0] ? toGalleryDraft(portalState.galleryItems[0]) : null,
  );
  const selectedPortfolioEntry =
    portalState.portfolioEntries.find((entry) => entry.id === selectedPortfolioId) ||
    portalState.portfolioEntries[0] ||
    null;
  const selectedGalleryItem =
    portalState.galleryItems.find((item) => item.id === selectedGalleryId) || portalState.galleryItems[0] || null;

  useEffect(() => {
    if (!selectedPortfolioEntry && portalState.portfolioEntries[0]) {
      setSelectedPortfolioId(portalState.portfolioEntries[0].id);
    }
  }, [portalState.portfolioEntries, selectedPortfolioEntry]);

  useEffect(() => {
    if (selectedPortfolioEntry) {
      setPortfolioDraft(toPortfolioDraft(selectedPortfolioEntry));
    }
  }, [selectedPortfolioEntry]);

  useEffect(() => {
    if (!selectedGalleryItem && portalState.galleryItems[0]) {
      setSelectedGalleryId(portalState.galleryItems[0].id);
    }
  }, [portalState.galleryItems, selectedGalleryItem]);

  useEffect(() => {
    if (selectedGalleryItem) {
      setGalleryDraft(toGalleryDraft(selectedGalleryItem));
    }
  }, [selectedGalleryItem]);

  const closePortfolioEditor = () => {
    if (selectedPortfolioEntry) {
      setPortfolioDraft(toPortfolioDraft(selectedPortfolioEntry));
    }

    setIsPortfolioEditorOpen(false);
  };

  const closeGalleryEditor = () => {
    if (selectedGalleryItem) {
      setGalleryDraft(toGalleryDraft(selectedGalleryItem));
    }

    setIsGalleryEditorOpen(false);
  };

  useDashboardDialogLifecycle(isPortfolioEditorOpen || isGalleryEditorOpen, () => {
    if (isGalleryEditorOpen) {
      closeGalleryEditor();
      return;
    }

    if (isPortfolioEditorOpen) {
      closePortfolioEditor();
    }
  });

  if (!hasMounted) {
    return <ProfessionalPageSkeleton />;
  }

  if (!isProfessional) {
    return <ProfessionalAccessScreen defaultTab="login" />;
  }

  if (!portalState.onboardingCompleted || !activeProfessional) {
    return <ProfessionalSetupScreen />;
  }

  const openPortfolioEditor = (portfolioId: string) => {
    const nextEntry = portalState.portfolioEntries.find((entry) => entry.id === portfolioId);
    setSelectedPortfolioId(portfolioId);

    if (nextEntry) {
      setPortfolioDraft(toPortfolioDraft(nextEntry));
    }

    setIsPortfolioEditorOpen(true);
  };

  const openGalleryEditor = (galleryId: string) => {
    const nextItem = portalState.galleryItems.find((item) => item.id === galleryId);
    setSelectedGalleryId(galleryId);

    if (nextItem) {
      setGalleryDraft(toGalleryDraft(nextItem));
    }

    setIsGalleryEditorOpen(true);
  };

  const handleAddPortfolioEntry = () => {
    const nextId = createPortfolioEntry();
    setPortfolioDraft(null);
    setSelectedPortfolioId(nextId);
    setIsPortfolioEditorOpen(true);
    setNotice(t('portfolio.addSuccess'));
  };

  const handleAddGalleryItem = () => {
    const nextId = createGalleryItem();
    setGalleryDraft(null);
    setSelectedGalleryId(nextId);
    setIsGalleryEditorOpen(true);
    setNotice(t('portfolio.galleryAddSuccess'));
  };

  const handleSavePortfolio = () => {
    if (!selectedPortfolioEntry || !portfolioDraft) {
      return;
    }

    savePortfolioEntry(selectedPortfolioEntry.id, {
      image: portfolioDraft.image,
      outcomes: buildOutcomes(portfolioDraft.outcomesText),
      periodLabel: portfolioDraft.periodLabel,
      serviceId: portfolioDraft.serviceId || undefined,
      summary: portfolioDraft.summary,
      title: portfolioDraft.title,
      visibility: portfolioDraft.visibility,
    });
    setNotice(t('portfolio.saveSuccess'));
    setIsPortfolioEditorOpen(false);
  };

  const handleSaveGallery = () => {
    if (!selectedGalleryItem || !galleryDraft) {
      return;
    }

    if (galleryDraft.isFeatured) {
      for (const item of portalState.galleryItems) {
        if (item.id !== selectedGalleryItem.id && item.isFeatured) {
          saveGalleryItem(item.id, { isFeatured: false });
        }
      }
    }

    saveGalleryItem(selectedGalleryItem.id, {
      alt: galleryDraft.alt,
      image: galleryDraft.image,
      isFeatured: galleryDraft.isFeatured,
      label: galleryDraft.label,
    });
    setNotice(t('portfolio.gallerySaveSuccess'));
    setIsGalleryEditorOpen(false);
  };

  return (
    <ProfessionalDashboardShell
      activeCoverageAreaCount={activeCoverageAreas.length}
      activeProfessional={activeProfessional}
      activeServiceCount={activeServiceConfigurations.length}
      activeTab="portfolio"
      averageServicePriceLabel={averageServicePriceLabel}
      clampedCompletionScore={clampedCompletionScore}
      headerLocationLabel={dashboardLocationLabel}
      notice={notice}
      onDismissNotice={() => setNotice(null)}
      responseTimeGoal={portalState.responseTimeGoal}
    >
      <ProfessionalDashboardPortfolioTab
        galleryItems={portalState.galleryItems}
        getServiceLabel={getServiceLabel}
        isGalleryEditorOpen={isGalleryEditorOpen}
        isPortfolioEditorOpen={isPortfolioEditorOpen}
        onAddGallery={handleAddGalleryItem}
        onAddPortfolio={handleAddPortfolioEntry}
        onEditGallery={openGalleryEditor}
        onEditPortfolio={openPortfolioEditor}
        portfolioEntries={portalState.portfolioEntries}
        publicPortfolioCount={publicPortfolioEntries.length}
        selectedGalleryId={selectedGalleryId}
        selectedPortfolioId={selectedPortfolioId}
      />

      {isPortfolioEditorOpen && selectedPortfolioEntry && portfolioDraft ? (
        <ProfessionalDashboardPortfolioEditorDialog
          activeServiceConfigurations={activeServiceConfigurations}
          getServiceLabel={getServiceLabel}
          onChangeDraft={setPortfolioDraft}
          onClose={closePortfolioEditor}
          onDelete={() => {
            deletePortfolioEntry(selectedPortfolioEntry.id);
            setNotice(t('portfolio.deleteSuccess'));
            setIsPortfolioEditorOpen(false);
          }}
          onSave={handleSavePortfolio}
          portfolioDraft={portfolioDraft}
        />
      ) : null}

      {isGalleryEditorOpen && selectedGalleryItem && galleryDraft ? (
        <ProfessionalDashboardGalleryEditorDialog
          galleryDraft={galleryDraft}
          onChangeDraft={setGalleryDraft}
          onClose={closeGalleryEditor}
          onDelete={() => {
            deleteGalleryItem(selectedGalleryItem.id);
            setNotice(t('portfolio.galleryDeleteSuccess'));
            setIsGalleryEditorOpen(false);
          }}
          onSave={handleSaveGallery}
        />
      ) : null}
    </ProfessionalDashboardShell>
  );
};
