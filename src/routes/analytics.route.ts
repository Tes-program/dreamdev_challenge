import { Router } from "express";
import {
  getTopMerchant,
  getMonthlyActiveMerchants,
  getProductAdoption,
  getKycFunnel,
  getFailureRates,
} from '../controllers/analytics.controller';


const Analyticsrouter = Router();

Analyticsrouter.get('/top-merchant', getTopMerchant);
Analyticsrouter.get('/monthly-active-merchants', getMonthlyActiveMerchants);
Analyticsrouter.get('/product-adoption', getProductAdoption);
Analyticsrouter.get('/kyc-funnel', getKycFunnel);
Analyticsrouter.get('/failure-rates', getFailureRates);

export default Analyticsrouter;