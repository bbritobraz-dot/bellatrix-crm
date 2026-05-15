export type ProductLine = 'vertical' | 'ph' | 'rolo' | 'romana' | 'painel';

export interface Dimension {
  width: number; // in meters
  height: number; // in meters
}

export interface PricingResult {
  chargedArea: number; // m2 ou metro linear base
  supplierCost: number;
  salePrice: number;
  profit: number;
  errors?: string[];
}

// === CONSTANTES DE REGRAS DE NEGÓCIO ===
const MIN_AREAS: Record<ProductLine, number> = {
  vertical: 1.5,
  ph: 1.2,
  rolo: 1.2,
  romana: 1.2,
  painel: 1.2,
};

const MAX_WIDTHS: Partial<Record<ProductLine, number>> = {
  ph: 3.0,
};

// ======================================
// FUNÇÕES PURAS DE CÁLCULO
// ======================================

export function validateMaxWidth(line: ProductLine, width: number, productMaxWidth?: number): string | null {
  // Regra geral da linha
  if (MAX_WIDTHS[line] && width > MAX_WIDTHS[line]!) {
    return `A largura máxima para a linha ${line.toUpperCase()} é de ${MAX_WIDTHS[line]}m.`;
  }
  // Regra específica do produto (ex: tecido rolô)
  if (productMaxWidth && width > productMaxWidth) {
    return `A largura máxima para este tecido/material é de ${productMaxWidth}m.`;
  }
  return null;
}

export function calculateArea(width: number, height: number): number {
  return width * height;
}

export function applyMinimumArea(line: ProductLine, actualArea: number): number {
  const minArea = MIN_AREAS[line];
  return Math.max(actualArea, minArea);
}

export function calculateProductCost(
  line: ProductLine,
  width: number,
  height: number,
  costUnit: 'm2' | 'linear_m' | 'unit',
  supplierCost: number,
  baseSalePrice: number,
  productMaxWidth?: number
): PricingResult {
  const errors: string[] = [];
  
  // 1. Validar largura (Mantemos o erro no array, mas permitimos o cálculo seguir)
  const widthError = validateMaxWidth(line, width, productMaxWidth);
  if (widthError) errors.push(widthError);

  // 2. Calcular Base
  let chargedArea = 0;
  
  if (costUnit === 'm2') {
    const actualArea = calculateArea(width, height);
    chargedArea = applyMinimumArea(line, actualArea);
  } else if (costUnit === 'linear_m') {
    chargedArea = Math.max(width, 1.0); 
  } else if (costUnit === 'unit') {
    chargedArea = 1;
  }

  // 3. Custo final e Preço de Venda Final
  const totalCost = chargedArea * supplierCost;
  const totalSale = chargedArea * baseSalePrice;

  return {
    chargedArea,
    supplierCost: totalCost,
    salePrice: totalSale,
    profit: totalSale - totalCost,
    errors: errors.length > 0 ? errors : undefined
  };
}

export function calculateAccessoryCost(
  slug: string,
  width: number,
  height: number,
  supplierCost: number,
  baseSalePrice: number,
  costUnit: 'linear_m' | 'unit' | 'm2'
): PricingResult {
  const errors: string[] = [];
  let chargedAmount = 0;

  if (costUnit === 'unit') {
    chargedAmount = 1;
  } else if (costUnit === 'linear_m') {
    if (slug.includes('bando') || slug.includes('caixa_box')) {
      if (width > 6.0) {
        errors.push("Acessório não suporta largura acima de 6 metros.");
      }
      const minLinear = slug.includes('vertical') ? 1.50 : 1.20;
      chargedAmount = Math.max(width, minLinear);
    } 
    else if (slug.includes('guia_lateral')) {
      chargedAmount = (2 * height) + width;
    } 
    else {
      chargedAmount = Math.max(width, 1.0);
    }
  }

  const totalCost = chargedAmount * supplierCost;
  const totalSale = chargedAmount * baseSalePrice;

  return {
    chargedArea: chargedAmount,
    supplierCost: totalCost,
    salePrice: totalSale,
    profit: totalSale - totalCost,
    errors: errors.length > 0 ? errors : undefined
  };
}

export function calculateMarginPercent(supplierCost: number, salePrice: number): number {
  if (supplierCost === 0) return 100;
  return ((salePrice - supplierCost) / supplierCost) * 100;
}

export function calculateQuoteTotals(items: { supplierCost: number; salePrice: number }[]) {
  const totalSupplierCost = items.reduce((acc, item) => acc + item.supplierCost, 0);
  const totalSalePrice = items.reduce((acc, item) => acc + item.salePrice, 0);
  const estimatedProfit = totalSalePrice - totalSupplierCost;

  return {
    totalSupplierCost,
    totalSalePrice,
    estimatedProfit
  };
}
