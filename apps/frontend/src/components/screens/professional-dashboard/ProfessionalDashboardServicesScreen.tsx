'use client';

import { useEffect, useState } from 'react';
import { ProfessionalAccessScreen } from '@/components/screens/ProfessionalAccessScreen';
import { ProfessionalPageSkeleton } from '@/components/screens/ProfessionalPageSkeleton';
import { ProfessionalSetupScreen } from '@/components/screens/ProfessionalSetupScreen';
import { parseInteger, toServiceDraft } from '@/components/screens/professional-dashboard/helpers';
import { ProfessionalDashboardServiceEditorDialog } from '@/components/screens/professional-dashboard/ProfessionalDashboardServiceEditorDialog';
import { ProfessionalDashboardServicesTab } from '@/components/screens/professional-dashboard/ProfessionalDashboardServicesTab';
import { ProfessionalDashboardShell } from '@/components/screens/professional-dashboard/ProfessionalDashboardShell';
import type { ServiceDraft } from '@/components/screens/professional-dashboard/types';
import { useDashboardDialogLifecycle } from '@/components/screens/professional-dashboard/useDashboardDialogLifecycle';
import { useProfessionalDashboardPageData } from '@/components/screens/professional-dashboard/useProfessionalDashboardPageData';
import type { ServiceDeliveryMode } from '@/types/catalog';

export const ProfessionalDashboardServicesScreen = () => {
  const {
    activeCoverageAreas,
    activeProfessional,
    activeServiceConfigurations,
    activateTemplateService,
    archiveService,
    averageServicePriceLabel,
    clampedCompletionScore,
    dashboardLocationLabel,
    featuredServiceConfiguration,
    getServiceLabel,
    hasMounted,
    getModeLabel,
    isProfessional,
    portalState,
    saveServiceConfiguration,
    serviceTemplates,
    t,
  } = useProfessionalDashboardPageData();
  const [notice, setNotice] = useState<string | null>(null);
  const [isServiceEditorOpen, setIsServiceEditorOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState(
    featuredServiceConfiguration?.serviceId || portalState.serviceConfigurations[0]?.serviceId || '',
  );
  const [serviceDraft, setServiceDraft] = useState<ServiceDraft | null>(
    featuredServiceConfiguration ? toServiceDraft(featuredServiceConfiguration) : null,
  );
  const selectedServiceConfiguration =
    portalState.serviceConfigurations.find((service) => service.serviceId === selectedServiceId) ||
    portalState.serviceConfigurations[0] ||
    null;
  const selectedServiceTemplate =
    serviceTemplates.find((service) => service.id === selectedServiceId) || serviceTemplates[0] || null;

  useEffect(() => {
    if (!selectedServiceConfiguration && portalState.serviceConfigurations[0]) {
      setSelectedServiceId(portalState.serviceConfigurations[0].serviceId);
    }
  }, [portalState.serviceConfigurations, selectedServiceConfiguration]);

  useEffect(() => {
    if (selectedServiceConfiguration) {
      setServiceDraft(toServiceDraft(selectedServiceConfiguration));
    }
  }, [selectedServiceConfiguration]);

  const closeServiceEditor = () => {
    if (selectedServiceConfiguration) {
      setServiceDraft(toServiceDraft(selectedServiceConfiguration));
    }

    setIsServiceEditorOpen(false);
  };

  useDashboardDialogLifecycle(isServiceEditorOpen, closeServiceEditor);

  if (!hasMounted) {
    return <ProfessionalPageSkeleton />;
  }

  if (!isProfessional) {
    return <ProfessionalAccessScreen defaultTab="login" />;
  }

  if (!portalState.onboardingCompleted || !activeProfessional) {
    return <ProfessionalSetupScreen />;
  }

  const openServiceEditor = (serviceId: string) => {
    const nextService = portalState.serviceConfigurations.find((service) => service.serviceId === serviceId);
    setSelectedServiceId(serviceId);

    if (nextService) {
      setServiceDraft(toServiceDraft(nextService));
    }

    setIsServiceEditorOpen(true);
  };

  const handleServiceModeToggle = (mode: ServiceDeliveryMode) => {
    if (!serviceDraft) {
      return;
    }

    const nextModes = {
      ...serviceDraft.serviceModes,
      homeVisit: mode === 'home_visit' ? !serviceDraft.serviceModes.homeVisit : serviceDraft.serviceModes.homeVisit,
      online: mode === 'online' ? !serviceDraft.serviceModes.online : serviceDraft.serviceModes.online,
      onsite: mode === 'onsite' ? !serviceDraft.serviceModes.onsite : serviceDraft.serviceModes.onsite,
    };
    const defaultModeIsActive =
      (serviceDraft.defaultMode === 'online' && nextModes.online) ||
      (serviceDraft.defaultMode === 'home_visit' && nextModes.homeVisit) ||
      (serviceDraft.defaultMode === 'onsite' && nextModes.onsite);
    const fallbackMode =
      (nextModes.online && 'online') ||
      (nextModes.homeVisit && 'home_visit') ||
      (nextModes.onsite && 'onsite') ||
      serviceDraft.defaultMode;

    setServiceDraft({
      ...serviceDraft,
      defaultMode: defaultModeIsActive ? serviceDraft.defaultMode : fallbackMode,
      serviceModes: nextModes,
    });
  };

  const handleToggleServiceActivation = (serviceId: string, isActive: boolean) => {
    if (isActive) {
      archiveService(serviceId);
      setNotice(
        t('services.archiveSuccess', {
          service: getServiceLabel(serviceId),
        }),
      );
      return;
    }

    activateTemplateService(serviceId);
    setNotice(
      t('services.activateSuccess', {
        service: getServiceLabel(serviceId),
      }),
    );
  };

  const handleSaveService = () => {
    if (!selectedServiceConfiguration || !serviceDraft) {
      return;
    }

    saveServiceConfiguration(selectedServiceConfiguration.serviceId, {
      bookingFlow: serviceDraft.bookingFlow,
      defaultMode: serviceDraft.defaultMode,
      duration: serviceDraft.duration,
      featured: serviceDraft.featured,
      isActive: true,
      leadTimeHours: parseInteger(serviceDraft.leadTimeHours, selectedServiceConfiguration.leadTimeHours),
      price: serviceDraft.price,
      serviceModes: serviceDraft.serviceModes,
      summary: serviceDraft.summary,
      weeklyCapacity: parseInteger(serviceDraft.weeklyCapacity, selectedServiceConfiguration.weeklyCapacity),
    });
    setNotice(t('services.saveSuccess', { service: getServiceLabel(selectedServiceConfiguration.serviceId) }));
    setIsServiceEditorOpen(false);
  };

  return (
    <ProfessionalDashboardShell
      activeCoverageAreaCount={activeCoverageAreas.length}
      activeProfessional={activeProfessional}
      activeServiceCount={activeServiceConfigurations.length}
      activeTab="services"
      averageServicePriceLabel={averageServicePriceLabel}
      clampedCompletionScore={clampedCompletionScore}
      headerLocationLabel={dashboardLocationLabel}
      notice={notice}
      onDismissNotice={() => setNotice(null)}
      responseTimeGoal={portalState.responseTimeGoal}
    >
      <ProfessionalDashboardServicesTab
        averageServicePriceLabel={averageServicePriceLabel}
        getModeLabel={getModeLabel}
        getServiceLabel={getServiceLabel}
        isServiceEditorOpen={isServiceEditorOpen}
        onEditService={openServiceEditor}
        onToggleActivation={(service) => handleToggleServiceActivation(service.serviceId, service.isActive)}
        selectedServiceId={selectedServiceId}
        serviceConfigurations={portalState.serviceConfigurations}
      />

      {isServiceEditorOpen && selectedServiceConfiguration && selectedServiceTemplate && serviceDraft ? (
        <ProfessionalDashboardServiceEditorDialog
          getModeLabel={getModeLabel}
          onChangeDraft={setServiceDraft}
          onClose={closeServiceEditor}
          onSave={handleSaveService}
          onToggleActivation={() => {
            handleToggleServiceActivation(
              selectedServiceConfiguration.serviceId,
              selectedServiceConfiguration.isActive,
            );
            setIsServiceEditorOpen(false);
          }}
          onToggleMode={handleServiceModeToggle}
          serviceDraft={serviceDraft}
          serviceIsActive={selectedServiceConfiguration.isActive}
          serviceTemplate={selectedServiceTemplate}
        />
      ) : null}
    </ProfessionalDashboardShell>
  );
};
