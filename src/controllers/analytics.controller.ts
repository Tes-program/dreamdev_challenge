import { Request, Response, NextFunction } from 'express';
import * as AnalyticsService from '../services/analytics.service';

export const getTopMerchant = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await AnalyticsService.getTopMerchant();
    res.status(200).json(data);
  } catch (error) { next(error); }
};

export const getMonthlyActiveMerchants = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await AnalyticsService.getMonthlyActiveMerchants();
    res.status(200).json(data);
  } catch (error) { next(error); }
};

export const getProductAdoption = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await AnalyticsService.getProductAdoption();
    res.status(200).json(data);
  } catch (error) { next(error); }
};

export const getKycFunnel = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await AnalyticsService.getKycFunnel();
    res.status(200).json(data);
  } catch (error) { next(error); }
};

export const getFailureRates = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await AnalyticsService.getFailureRates();
    res.status(200).json(data);
  } catch (error) { next(error); }
};
