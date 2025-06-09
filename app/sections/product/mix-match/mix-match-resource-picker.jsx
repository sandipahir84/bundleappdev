import React, { useMemo } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import {
  Box,
  Modal,
  DataTable,
  Button,
  FormLayout,
} from "@shopify/polaris";
import useToast from "../../../components/toast/use-toast";
import { Field, Form } from "../../../components/hook-form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from 'zod';
import { ValuesPreview } from "../../../components/form-validation-view/values-preview";
import { CONFIG } from "../../../global-config";
import { SectionCreateUpdateSchema } from "../../../schema/validateSchema";


export function MixMatchResourcePicker({ dialog, title, onSelect, currentSection, sectionLength, sections }) {
  const app = useAppBridge();
  const { showToast } = useToast();
  
  let options = [];
  
  if (sections?.type === "product" || currentSection?.type === "product") {
    
    options = [
      { label: "Products", value: "product" },
    ];
  } else if (sections?.type === "collection" || currentSection?.type === "collection") {
    options = [
      { label: "Collections", value: "collection" },
    ];
  } else {
    options = [
      { label: "Products", value: "product" },
      { label: "Collections", value: "collection" },
    ];
  }
  
  

  const defaultValues = useMemo(() => {
    return {
      _id: currentSection?._id || sectionLength,
      type: currentSection?.type || sections?.type || "product",
      sectionName: currentSection?.sectionName || "",
      items: currentSection?.items || [],
    };
  }, [currentSection, sectionLength]);

  // Use react-hook-form with Zod validation resolver
  const methods = useForm({
    resolver: zodResolver(SectionCreateUpdateSchema),
    defaultValues,
  });

  const {
    watch,
    handleSubmit,
    setValue,
    clearErrors,
    setError,
    formState: { isSubmitting, isDirty, errors },
  } = methods;

  const values = watch();

  const isProduct = (id) => id.includes('Product') || id.includes('ProductVariant');
  const isCollection = (id) => id.includes('Collection');

  const openResourcePicker = async (type, selectionIds = []) => {
    try {
      const resources = await app.resourcePicker({
        type,
        multiple: type === "product",
        action: "select",
        selectionIds: selectionIds,
      });

      if (resources) {
        const resourcesItems = resources.map((item) => {
        
          const mappedItem = {
            id: item.id,
            title: item?.title || item?.name || '',
            price: item?.price || item.variants?.[0]?.price || 0, // fallback to first variant price
            images: item?.images || [],
            image: item?.image || []
          };

          // Check for variants and map them accordingly
          if (item.variants && item.variants.length > 0) {
            mappedItem.variants = item.variants.map((variant) => ({
              id: variant.id,
              title: variant?.title || '',
              price: variant?.price || 0,
              image: variant?.image, // variants may not have direct images, check for each variant
            }));
          }

          return mappedItem;
        });

        setValue('items', resourcesItems);
      }
    } catch (err) {
      console.error("Resource Picker Error:", err);
    }
  };

  const onSubmit = handleSubmit(async (data) => {
    try {
      if (!data._id || !data.sectionName) {
        showToast({ message: "⚠️ Please enter a section name.", status: 'critical' });
        return;
      }
      // console.log("form_submit_data", data);
      if (typeof onSelect === "function") {
        onSelect(data);
        dialog.onFalse();
      }

      // Simulate network request
      // await new Promise((res) => setTimeout(res, 1000));
      // reset(data);  // Reset the form after submission
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  });

  const rows = values?.items.flatMap((item) => {
    if (item.variants && item.variants.length > 0) {
      return item.variants.map((variant) => [
        item.title,
        variant.title || "-",
        variant.price || "-",
        variant.sku || "-",
        variant.inventory_quantity ?? "-",
      ]);
    } else if (item.products && Array.isArray(item.products)) {
      return [
        [
          `Collection: ${item.title}`,
          "-",
          "-",
          "-",
          item.products.length,
        ],
      ];
    } else {
      return [[item.title || "-", "-", "-", "-", "-"]];
    }
  });

  return (
    <Modal
      open={dialog.value}
      onClose={dialog.onFalse}
      title={title}
      large
      primaryAction={{
        content: "Done",
        onAction: onSubmit,
      }}
      secondaryActions={[
        {
          content: "Cancel",
          onAction: dialog.onFalse,
        },
      ]}
    >
      <Modal.Section>
        <Form methods={methods} onSubmit={onSubmit}>
          {CONFIG.form.debug && <ValuesPreview onCloseDebug={() => { }} />}
          <FormLayout>
            <Box style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Field.Select
                name={`type`}
                // label="Section Type"
                options={options}
                onChange={(e) => {
                  const value = e;
                  setValue(`type`, value);
                  // Cleanup other fields depending on requirement
                  if (value === "product") {
                    setValue("items", (values.items || []).filter((item) => isProduct(item.id)));
                  } else if (value === "collection") {
                    setValue("items", (values.items || []).filter((item) => isCollection(item.id)));
                  } else {
                    setValue("items", []);
                  }
                }}
              />
              <Button
                primary
                onClick={() => openResourcePicker(values?.type, values.items)}
                disabled={values?.type === "select"}
              >
                Pick {values?.type === "product" ? "Products" : "Collections"}
              </Button>
            </Box>
            {errors.items && (values.items?.length === 0 || !values.items) && (
              <div style={{ color: "var(--p-color-text-critical)", fontSize: "12px", marginTop: "2px" }}>
                {errors.items.message}
              </div>
            )}
            <Field.Text name={`sectionName`} label="Section Name" />
          </FormLayout>
        </Form>

        <FormLayout>
          {rows.length > 0 && (
            <Box padding="4">
              <DataTable
                columnContentTypes={[
                  "text",
                  "text",
                  "text",
                  "text",
                  "numeric",
                ]}
                headings={[
                  "Name",
                  "Variant",
                  "Price",
                  "SKU",
                  "Inventory / Count",
                ]}
                rows={rows}
                hideScrollIndicator
              />
            </Box>
          )}
        </FormLayout>
      </Modal.Section>
    </Modal>
  );
}
