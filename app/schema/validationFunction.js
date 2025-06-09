// validation.js
import { z } from "zod";
import dayjs from "dayjs";
import { isValidPhoneNumber } from "react-phone-number-input";
import { schemaHelper } from "../components/hook-form";
// import { timezoneList } from "src/utils/timezones";

export const minDate = dayjs("1900-01-01");
export const maxDate = dayjs(); // Current date
// export const TIMEZONE_OPTIONS = timezoneList;

// Utility functions for transformations
const capitalize = (value) => value.replace(/\b\w/g, char => char.toUpperCase());  // Capitalizes the first letter of each word
const uppercase = (value) => value.toUpperCase();  // Converts the whole string to uppercase
const lowercase = (value) => value.toLowerCase();  // Converts the whole string to lowercase


export const zodValidation = (type, isRequired = false, fieldName = "Field", options = {}) => {
  switch (type) {
    case "string":
      let stringSchema = z
        .string();
      if (options?.maxLength) {
        stringSchema = stringSchema.max(options.maxLength, `${fieldName} must not exceed ${options.maxLength} characters`);
      }
      if (isRequired) {
        stringSchema = stringSchema.nonempty({ message: `${fieldName} is required.` });
      } else {
        stringSchema = stringSchema.optional().nullable().transform((val) => val?.trim() || '');
      }
      if (options?.isValidPhoneNumber) {
        stringSchema.refine(isValidPhoneNumber, { message: 'Invalid phone number!' });
      }
      // Apply transformation if needed
      if (options?.transform) {
        switch (options.transform) {
          case 'capitalize':
            stringSchema = stringSchema.transform(capitalize);  // Capitalize the string
            break;
          case 'uppercase':
            stringSchema = stringSchema.transform(uppercase);  // Convert string to uppercase
            break;
          case 'lowercase':
            stringSchema = stringSchema.transform(lowercase);  // Convert string to lowercase
            break;
          default:
            // No transformation if the transform option is invalid or undefined
            break;
        }
      }

      return stringSchema;

    case "phone_number":
      let phoneNumberSchema = z
        .string()
        .max(options.maxLength || 255, { message: `${fieldName} cannot exceed ${options.maxLength || 255} characters.` });

      if (isRequired) {
        phoneNumberSchema = phoneNumberSchema.nonempty({ message: `${fieldName} is required.` }).refine(isValidPhoneNumber, { message: 'Invalid phone number!' });
      } else {
        phoneNumberSchema = phoneNumberSchema.optional().nullable();
      }
      return phoneNumberSchema;

    // case "timezone":
    //   let timezoneSchema = z
    //     .string();

    //   if (isRequired) {
    //     timezoneSchema = timezoneSchema.nonempty({ message: `${fieldName} is required.` }).refine((value) => TIMEZONE_OPTIONS.flatMap(group => group.options).some(option => option.value === value), {
    //       message: 'Invalid timezone selected!',
    //     });
    //   } else {
    //     timezoneSchema = timezoneSchema.optional().nullable();
    //   }
    //   return timezoneSchema;

    case "editor":
      return isRequired ? schemaHelper.editor({
        message: `${fieldName} is required.`, // Custom error message for required field
      }) : z.string().optional().nullable().transform((val) => val?.trim() || null);

    case "number":
      let numberSchema = z
        .union([
          z.number().positive(`${fieldName} must be positive.`).refine((val) => Number.isFinite(val), 'Age must be a valid number'), // Valid number
          z.string().nullable(), // Allows null
        ]);

      if (isRequired) {
        numberSchema = numberSchema.refine((val) => Number.isFinite(val), `${fieldName} must be a valid number.`).transform((val) => parseFloat(val.toFixed(options.decimalPlaces || 0)))
      } else {
        numberSchema = numberSchema.optional().nullable();
      }
      return numberSchema;
    // return isRequired ? z
    // .number()
    // .positive(`${fieldName} must be positive.`)
    // .refine((val) => Number.isFinite(val), `${fieldName} must be a valid number.`)
    // .transform((val) => parseFloat(val.toFixed(options.decimalPlaces || 0))); : z
    // .number()
    // .positive(`${fieldName} must be positive.`).optional().nullable();

    case "price":
      if (isRequired) {
        return schemaHelper.nullableInput(
          z.number({ coerce: true }).min(1, { message: "Price must be at least 1." }),
          { message: "Price is required." }
        );
      } else {
        return z.any().optional().nullable();
      }

    case "boolean":
      let booleanSchema = z.boolean();
      return isRequired ? booleanSchema : booleanSchema.optional().nullable();


    case "date":
      const dateSchema = z
        .string()
        .transform((val) => val?.trim() || ''); // Ensure the value is trimmed and defaults to an empty string

      if (isRequired) {
        // If required, ensure the string is not empty
        return dateSchema.refine((val) => val !== '', {
          message: "Date is required and cannot be empty.",
        });
      } else {
        // If optional, allow empty or null values
        return dateSchema.optional().nullable();
      }

    case "dateofBirth":
      let dateofBirthSchema = z
        .string()
        .refine(
          (val) => dayjs(val).isAfter(minDate) && dayjs(val).isBefore(maxDate),
          `${fieldName} must be between ${minDate.format("YYYY-MM-DD")} and ${maxDate.format("YYYY-MM-DD")}.`
        );
      return isRequired ? dateofBirthSchema : dateofBirthSchema.optional().nullable();

    case "array":
      const arraySchema = z.array(z.any().nullable()); // Array of nullable strings
      if (isRequired) {
        // Required: Enforce minimum items and disallow empty arrays
        return arraySchema.min(
          options.minItems || 0,
          `${fieldName} must contain at least ${options.minItems || 0} items.`
        );
      } else {
        // Optional: Allow undefined or empty arrays
        return arraySchema.optional();
      }

    case "object":
      let objectSchema = z.object(options.schema);
      return isRequired ? objectSchema : objectSchema.optional().nullable();

    case "email":
      let emailSchema = z
        .string()
        .email('Invalid email address!')
        .transform((value) => (value === '' ? '' : value)); // Ensure '' is treated explicitly
      if (isRequired) {
        emailSchema = emailSchema.nonempty({ message: `${fieldName} is required.` }); // Make required
      } else {
        emailSchema = emailSchema.optional().nullable().or(z.literal(''));
      }
      return emailSchema;

    case "uri":
      let uriSchema = z.string().url(`${fieldName} must be a valid URI.`);
      return isRequired ? uriSchema : uriSchema.optional().nullable();

    case "enum":
      let enumSchema = z.enum(options.values);
      return isRequired ? enumSchema : enumSchema.optional().nullable();

    case "foreignKey":
      if (isRequired) {
        // Required foreign key schema
        return z
          .number({
            required_error: `${fieldName} is required.`, // Error if the field is missing
            invalid_type_error: `${fieldName} must be a number.`, // Error if the type is invalid
          })
          .int(`${fieldName} must be an integer.`) // Ensure it's an integer
          .positive(`${fieldName} must be positive.`); // Ensure it's a positive number
      } else {
        // Optional foreign key schema
        return z.any().optional().nullable(); // Allow any value, optional, and nullable
      }

    case "password":
      let passwordSchema = z
        .string()
        .min(6, `${fieldName} must be at least 6 characters long.`)
        .max(16, `${fieldName} must not exceed 16 characters.`)
        .regex(/^(?=.*[A-Z])(?=.*\d).+$/, `${fieldName} must contain at least one uppercase letter and one number.`);
      return isRequired ? passwordSchema : passwordSchema.optional().nullable();

    case "confirmPassword":
      let confirmPasswordSchema = z
        .string()
        .min(6, `${fieldName} must be at least 6 characters long.`)
        .max(16, `${fieldName} must not exceed 16 characters.`);
      return isRequired ? confirmPasswordSchema : confirmPasswordSchema.optional().nullable();

    case "dateOfBirth":
      let dobSchema = z
        .string()
        .refine(
          (val) => dayjs(val).isValid(),
          `Date of birth must be valid.`
        )
        .refine(
          (val) => dayjs(val).isAfter(minDate) && dayjs(val).isBefore(maxDate),
          `Date of birth must be between ${minDate.format("YYYY-MM-DD")} and ${maxDate.format("YYYY-MM-DD")}.`
        );
      return isRequired ? dobSchema : dobSchema.optional().nullable();

    case "otp":
      let otpSchema = z
        .string()
        .regex(/^\d{6}$/, `OTP must be a 6-digit number.`);
      return isRequired ? otpSchema : otpSchema.optional().nullable();

    case "newPassword":
      let newPasswordSchema = z
        .string()
        .min(6, `${fieldName} must be at least 6 characters long.`)
        .max(16, `${fieldName} must not exceed 16 characters.`)
        .regex(/^(?=.*[A-Z])(?=.*\d).+$/, `${fieldName} must contain at least one uppercase letter and one number.`);
      return isRequired ? newPasswordSchema : newPasswordSchema.optional().nullable();

    default:
      throw new Error(`Unknown validation type: ${type}`);
  }
};

export const getAllowedFileTypes = (fileTypes) => {
  const allowedTypes = [];
  if (fileTypes.includes("image")) {
    allowedTypes.push("image/jpeg", "image/jpg", "image/png", "image/gif"); // Allow image types
  }
  if (fileTypes.includes("video")) {
    allowedTypes.push("video/mp4", "video/webm", "video/ogg"); // Allow video types
  }
  if (fileTypes.includes("csv")) {
    allowedTypes.push("text/csv", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"); // Allow CSV, XLS, and XLSX
  }
  if (fileTypes.length === 0) {
    allowedTypes.push("*"); // Allow any file type
  }
  return allowedTypes;
};

export const singleFileValidation = (isRequired = false, fieldName = "File", fileTypes = ["image"], options = {}) => {
  const allowedTypes = getAllowedFileTypes(fileTypes);
  return isRequired ? schemaHelper.file({ message: `${fieldName} is required!` }) : z.any().optional().nullable();
};

export const multipleFileValidation = (isRequired = false, fieldName = "Files", fileTypes = ["image"], options = {}) => {
  const allowedTypes = getAllowedFileTypes(fileTypes);
  return isRequired ? schemaHelper.files({ message: `${fieldName} is required.` }) : z.any().optional().nullable();
};
