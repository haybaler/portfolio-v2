import type { ComponentType } from 'react';
import Attribution from '@/pages/work/Attribution';
import BoardSlides from '@/pages/work/BoardSlides';
import BrandCollateral from '@/pages/work/BrandCollateral';
import BusinessContextEngine from '@/pages/work/BusinessContextEngine';
import CrmCompliance from '@/pages/work/CrmCompliance';
import ErpAssistant from '@/pages/work/ErpAssistant';
import HcpAudiences from '@/pages/work/HcpAudiences';
import SalesDashboard from '@/pages/work/SalesDashboard';
import VisitorId from '@/pages/work/VisitorId';
import WebsiteAi, { WebsiteCro } from '@/pages/work/WebsiteAi';

/** Which interactive page renders for each case-study slug. */
export const FILL_IN_KEY: Record<string, ComponentType> = {
  attribution: Attribution,
  'board-slides': BoardSlides,
  'brand-collateral': BrandCollateral,
  'business-context-engine': BusinessContextEngine,
  'crm-compliance': CrmCompliance,
  'erp-assistant': ErpAssistant,
  'hcp-audiences': HcpAudiences,
  'sales-dashboard': SalesDashboard,
  'visitor-id': VisitorId,
  'website-ai': WebsiteAi,
  'website-cro': WebsiteCro,
};
