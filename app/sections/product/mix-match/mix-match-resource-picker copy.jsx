import React, { useState, useEffect } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import {
  Box,
  Modal,
  Select,
  TextField,
  DataTable,
  Button,
  FormLayout,
} from "@shopify/polaris";
import useToast from "../../../components/toast/use-toast";

export function MixMatchResourcePicker({ dialog, title, sections, onSelect }) {
  const app = useAppBridge();
  const { showToast } = useToast();

  const [selectedType, setSelectedType] = useState(sections?.type || "product");
  const [selectionData, setSelectionData] = useState([]);
  const [groupData, setGroupData] = useState({
    sectionName: sections?.sectionName || "",
    requirement: sections?.requirement || "exactQuantity",
    quantity: sections?.quantity || "1",
    minquantity: sections?.minquantity || "1",
    maxquantity: sections?.maxquantity || "0",
    description: sections?.description || "",
    items: sections?.items || [],
  });

  const options = [
    { label: "Products", value: "product" },
    { label: "Collections", value: "collection" },
  ];

  const groupLabel = selectedType === "product" ? "Products" : "Collections";

  // Update groupData when selectionData changes
  useEffect(() => {
    if (selectionData?.length > 0) {
      setGroupData((prev) => ({
        ...prev,
        items: selectionData,
      }));
    }
  }, [selectionData]);

  const selectionItems = groupData.items.map((item) => {
    const mappedItem = {
      id: item.id,
      title: item?.title || item?.name || '',
      price: item?.price || item.variants?.[0]?.price || 0,  // fallback to first variant price
      images: item?.images || [],
    };

    if (item.variants && item.variants.length > 0) {
      mappedItem.variants = item.variants.map((variant) => ({
        id: variant.id,
        title: variant?.title || '',
        price: variant?.price || 0,
        image: variant?.image, // variants have no image directly
      }));
    }

    return mappedItem;
  });

  const handleSelectionChange = (value) => {
    setSelectedType(value);
    if (typeof onSelect === "function") {
      onSelect();
    }
    setGroupData((prev) => ({
      ...prev,
      items: [],
    }));
  };

  const openResourcePicker = async (type) => {
    try {
      const resources = await app.resourcePicker({
        type,
        multiple: type === "product",
        action: "select",
        selectionIds: selectionItems,
      });

      if (resources) {
        setGroupData((prev) => ({
          ...prev,
          items: resources,
        }));
        if (typeof onSelect === "function") {
          setSelectionData(resources);
        }
      }
    } catch (err) {
      console.error("Resource Picker Error:", err);
    }
  };

  const handleSubmit = () => {
    const sectionType = selectedType;
    const groupName = groupData.sectionName; // Fixed: sectionName instead of name

    // Validation: Group name and selected items must exist
    if (!groupName) {
      showToast({
        message: "⚠️ Please enter a group name.",
        status: 'critical',  // This will give it a red color indicating an error
      });
      return;
    }

    if (selectionItems.length === 0) {
      showToast({
        message: `⚠️ Please select at least one ${sectionType === "product" ? "product" : "collection"}.`,
        status: 'critical',  // Critical indicates an error state
      });
      return;
    }

    if (typeof onSelect === "function") {
      onSelect({
        ...groupData,
        type: sectionType,
        sectionName: groupName,
        items: selectionItems,
      });
    }
    dialog.onFalse(); // Close modal
  };

  const rows = groupData.items.flatMap((item) => {
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
        onAction: handleSubmit,
      }}
      secondaryActions={[
        {
          content: "Cancel",
          onAction: dialog.onFalse,
        },
      ]}
    >
      <Modal.Section>
        <FormLayout>
          <Box style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Select
              name="sectionType"
              options={options}
              onChange={handleSelectionChange}
              value={selectedType}
              fullWidth
              style={{ flex: 1 }}
            />
            <Button
              primary
              onClick={() => openResourcePicker(selectedType)}
              disabled={selectedType === "select"}
            >
              Pick {groupLabel}
            </Button>
          </Box>

          <Box padding="4">
            <TextField
              label={`${groupLabel} Group Name`}
              name="groupName"
              placeholder={`${groupLabel} Group Name`}
              value={groupData?.sectionName || ""} // Fixed here
              onChange={(value) =>
                setGroupData((prev) => ({
                  ...prev,
                  sectionName: value, // Fixed: sectionName instead of name
                }))
              }
              autoComplete="off"
              fullWidth
              error={!groupData?.sectionName ? "Group name is required" : ""}
            />
          </Box>

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
