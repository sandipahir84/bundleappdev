import { z as zod } from 'zod';
import { multipleFileValidation, singleFileValidation, zodValidation } from './validationFunction'; // Ensure this is correctly imported

const SectionSchema = zod.object({
  sectionName: zodValidation('string', true, 'section Name', {}),
  requirement: zod.enum(['exactQuantity', 'minQuantity', 'rangeQuantity']).optional(),
  quantity: zodValidation('number', false, 'Quantity', {}),
  minquantity: zodValidation('number', false, 'Min Quantity', {}),
  maxquantity: zodValidation('number', false, 'Max Quantity', {}),
  description: zodValidation('string', false, 'Description', {}),
  type: zodValidation('string', true, 'section Name', {}),
  items: zodValidation('array', false, 'Sections', {}),
  // items: zod.any().optional().nullable(),
}).superRefine((data, ctx) => {
  if (data.requirement === 'exactQuantity') {
    if (data.quantity == null || data.quantity < 1) {
      ctx.addIssue({
        path: ['quantity'],
        code: zod.ZodIssueCode.custom,
        message: 'Quantity is required when requirement is exactQuantity',
      });
    }
  }

  if (data.requirement === 'minQuantity') {
    if (data.minquantity == null || data.minquantity < 1) {
      ctx.addIssue({
        path: ['minquantity'],
        code: zod.ZodIssueCode.custom,
        message: 'Minquantity is required when requirement is minQuantity',
      });
    }
  }

  if (data.requirement === 'rangeQuantity') {
    if (data.minquantity == null || data.minquantity < 1) {
      ctx.addIssue({
        path: ['minquantity'],
        code: zod.ZodIssueCode.custom,
        message: 'Minquantity is required when requirement is rangeQuantity',
      });
    }
    if (data.maxquantity == null || data.maxquantity < 1) {
      ctx.addIssue({
        path: ['maxquantity'],
        code: zod.ZodIssueCode.custom,
        message: 'Maxquantity is required when requirement is rangeQuantity',
      });
    }
  }
});

export const MixMatchCreateUpdateSchema = zod.object({
  // sections: zodValidation('array', false, 'Sections', {}),
  sections: zod.array(zod.lazy(() => SectionSchema)).min(1, { message: 'At least one section is required' }),
  discount_type: zodValidation('string', true, 'Discount Type', {}),
  discount_value: zodValidation('number', true, 'Discount Value', {}),
  totalqty: zodValidation('number', true, 'Total Qty', {}),
  title: zodValidation('string', true, 'Title', {}),
  short_description: zodValidation('string', false, 'Sub Description', { maxLength: 5000 }),
  description: zodValidation('string', false, 'Description', {}),
  start_datetime: zodValidation('date', false, 'Start Date Time', {}), // Required date
  end_datetime: zodValidation('date', false, 'End Date Time', {}), // End datetime must be greater than start datetime
  status: zodValidation('string', true, 'Status', {}),
  media: singleFileValidation(false, 'Images', ['image'], { maxSize: 5 * 1024 * 1024 })
}).superRefine((val, ctx) => {
  // Validate discount value
  if (!val.discount_value || parseFloat(val.discount_value) <= 0) {
    ctx.addIssue({
      path: ['discount_value'],
      code: zod.ZodIssueCode.custom,
      message: 'Discount value must be greater than 0',
    });
  }

  if (!val.totalqty || parseFloat(val.totalqty) <= 0) {
    ctx.addIssue({
      path: ['totalqty'],
      code: zod.ZodIssueCode.custom,
      message: 'Totalqty value must be greater than 0',
    });
  }

  if (val.start_datetime && val.end_datetime && new Date(val.end_datetime) < new Date(val.start_datetime)) {
    ctx.addIssue({
      code: zod.ZodIssueCode.custom,
      message: "End Date Time must be greater than or equal to Start Date Time!",
      path: ["end_datetime"],
    });
  }
});


export const SectionCreateUpdateSchema = zod.object({
  // sections: zodValidation('array', false, 'Sections', {}),
  _id: zod.number().int().min(1, "Section Index Id must be a positive integer"),
  sectionName: zodValidation('string', true, 'Title', {}),
  type: zodValidation('string', true, 'Title', {}),
  items: zodValidation('array', true, 'Section Items', {}),
  // items: z.array(z.any()).min(1, "Please pick at least 1 item"),
});
