import {
  Card,
  Button,
  ContextualSaveBar,
  InlineStack,
  Text,
  BlockStack,
  Layout,
  Thumbnail,
  InlineGrid,
  Grid,
  LegacyCard
} from '@shopify/polaris';
import { useFieldArray, useForm } from 'react-hook-form';
import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { PlusIcon } from '@shopify/polaris-icons';
import { useBoolean } from 'minimal-shared';
import { CONFIG } from '../../../global-config';
import { ValuesPreview } from '../../../components/form-validation-view/values-preview';
import { Field, Form } from '../../../components/hook-form';
import { MixMatchResourcePicker } from './mix-match-resource-picker';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from '@remix-run/react';
import { paths } from '../../../routes/paths';
import useToast from '../../../components/toast/use-toast';
import { MixMatchCreateApi, MixMatchUpdateApi } from '../../../redux/slices/mixmatchSlice';
import { MixMatchCreateUpdateSchema } from '../../../schema/validateSchema';

const defaultImage = "/storage/defaultImage.png";  // your default image URL

const discountSuffix = (discountType) => {
  switch (discountType) {
    case 'PER':
      return '%'; // Percentage for "Percentage discount"
    case 'FIX':
      return 'Rs.'; // Rs for "Fixed discount"
    case 'SET':
      return 'Rs.'; // No suffix for "Set price"
    default:
      return ''; // Default is no suffix
  }
};

export default function MixMatchForm({ currentMixMatch, applicationUrl, mediaUrl }) {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const dispatch = useDispatch();
  const isOpenAddResourcePicker = useBoolean();
  const isOpenEditResourcePicker = useBoolean();
  const [isSetEditResource, setIsSetEditResource] = useState({});
  const mixmatchCreateLoading = useSelector((state) => state.mixmatch.loading?.create);
  const mixmatchUpdateLoading = useSelector((state) => state.mixmatch.loading?.update);

  const requirementOptions = [
    { label: 'Exact quantity', value: 'exactQuantity' },
    { label: 'Minimum quantity', value: 'minQuantity' },
    { label: 'Range quantity', value: 'rangeQuantity' },
  ];

  const DISCOUNT_TYPE_OPTIONS = [
    // { value: "PER", label: "Percentage discount" },
    // { value: "FIX", label: "Fixed discount" },
    { value: "SET", label: "Set price" },
    // { value: "FREE-SHIPPING", label: "Free shipping" },
    // { value: "NO_DISCOUNT", label: "No discount" },
  ];

  const STATUS_OPTIONS = [
    { value: 'active', label: "Active" },
    { value: 'draft', label: "Draft" },
  ];

  // Default form values based on the currentMixMatch data
  const defaultValues = useMemo(() => {
    // const imagesNameArray = currentMixMatch?.media?.length > 0
    //   ? currentMixMatch.media.map(imageObj => imageObj.url || imageObj.src || imageObj.originalSrc || '')
    //   : [];

    const imagesUrl = currentMixMatch?.media && mediaUrl
      ? `${mediaUrl}/${currentMixMatch?.media}`
      : '';

    return {
      sections: (currentMixMatch?.sections ?? []).map((section, index) => ({
        ...section,
        _id: section._id ?? (index + 1),  // <-- index + 1 here
      })) || [],
      discount_type: currentMixMatch?.discount_type || "SET",
      discount_value: currentMixMatch?.discount_value || "",
      totalqty: currentMixMatch?.totalqty|| "",
      title: currentMixMatch?.title || '',
      short_description: currentMixMatch?.short_description || '',
      description: currentMixMatch?.description || '',
      media: imagesUrl || null,
      start_datetime: currentMixMatch?.start_datetime || null,
      end_datetime: currentMixMatch?.end_datetime || null,
      status: currentMixMatch?.status || "active",
    };
  }, [currentMixMatch, mediaUrl]);

  // Use react-hook-form with Zod validation resolver
  const methods = useForm({
    resolver: zodResolver(MixMatchCreateUpdateSchema),
    defaultValues,
  });

  const {
    control,
    reset,
    watch,
    handleSubmit,
    setValue,
    clearErrors,
    setError,
    formState: { isSubmitting, isDirty, errors },
  } = methods;

  const { fields, remove } = useFieldArray({
    control,
    name: "sections"
  });

  const values = watch();
  console.log("values",values);
  useEffect(() => {
    fields.forEach((item, index) => {
      if (!values.sections?.[index]?.items) {
        setValue(`sections.${index}.items`, item.items ?? [], {
          shouldDirty: true,   // <- you already do this
          shouldTouch: true,
          shouldValidate: true
        });
      }
    });
  }, [fields, values.sections, setValue]);

  // console.log("values", values);

  // Handle form submission
  const onSubmit = handleSubmit(async (data) => {
    try {
      if (currentMixMatch?.id) {
        dispatch(MixMatchUpdateApi({ ...data, id: currentMixMatch?.id })).then((action) => {
          if (action.meta.requestStatus === 'fulfilled') {
            const payloadData = action.payload;
            const message = payloadData?.data?.message || 'Updated successfully';
            showToast({
              message,
              status: 'success'
            });
            navigate(paths.dashboard.mixmatch.list);
          } else if (action.meta.requestStatus === 'rejected') {
            const status = action.payload?.status;
            const message = action.payload?.message;
            const data = action.payload;
            let errorMessage = data?.data?.message ? data?.data?.message : (data?.message ? data?.message : 'An unexpected error occurred. Please try again.');
            showToast({
              message: errorMessage || "Updated Failed",
              status: 'error'
            });
          }
        });
      } else {
        dispatch(MixMatchCreateApi(data)).then((action) => {
          if (action.meta.requestStatus === 'fulfilled') {
            const payloadData = action.payload;
            const message = payloadData?.data?.message || 'Created successfully';
            showToast({
              message,
              status: 'success'
            });
            navigate(paths.dashboard.mixmatch.list);
          } else if (action.meta.requestStatus === 'rejected') {
            const status = action.payload?.status;
            const message = action.payload?.message;
            const data = action.payload;
            let errorMessage = data?.data?.message ? data?.data?.message : (data?.message ? data?.message : 'An unexpected error occurred. Please try again.');
            showToast({
              message: errorMessage || "Created Failed",
              status: 'error'
            });
          }
        });
      }

      // Simulate network request
      // await new Promise((res) => setTimeout(res, 1000));
      // reset(data);  // Reset the form after submission
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  });

  // Add this function to handle section updates
  const handleSectionUpdate = (newSection) => {

    if (!newSection || !newSection.sectionName || !newSection._id) {
      setError('sections', { type: 'manual', message: 'Sections is required' });
      return;
    }

    const currentSections = watch('sections') || [];

    // Check if a section with the same group name already exists
    const sectionIndex = currentSections.findIndex((section) => {
      // console.log(section._id, newSection._id);  // Log the values you're comparing
      return section._id === newSection._id;
    });
    let updatedSections;

    if (sectionIndex !== -1) {
      // Update the existing section
      updatedSections = currentSections.map((section) => {
        if (section._id === newSection._id) {
          let updatedSection = { ...section, ...newSection };

          const requirement = updatedSection.requirement; // <- use updatedSection.requirement

          // Apply conditional logic
          if (requirement === 'exactQuantity') {
            updatedSection.quantity = newSection.quantity ?? updatedSection.quantity;
          }

          if (requirement === 'minQuantity') {
            updatedSection.minquantity = newSection.minquantity ?? updatedSection.minquantity;
          }

          if (requirement === 'rangeQuantity') {
            updatedSection.minquantity = newSection.minquantity ?? updatedSection.minquantity;
            updatedSection.maxquantity = newSection.maxquantity ?? updatedSection.maxquantity;
          }

          return updatedSection;
        }
        return section;
      });
    } else {
      // Add new section
      const requirement = newSection.requirement || 'exactQuantity'; // Default if not set

      const newSectionWithDefaultRequirement = {
        ...newSection,
        requirement,
      };

      // Apply conditional keys for new section
      if (requirement === 'exactQuantity') {
        newSectionWithDefaultRequirement.quantity = newSection.quantity ?? 1; // or set a fallback 1
      }

      if (requirement === 'minQuantity') {
        newSectionWithDefaultRequirement.minquantity = newSection.minquantity ?? 1;
      }

      if (requirement === 'rangeQuantity') {
        newSectionWithDefaultRequirement.minquantity = newSection.minquantity ?? 1;
        newSectionWithDefaultRequirement.maxquantity = newSection.maxquantity ?? 1;
      }

      updatedSections = [...currentSections, newSectionWithDefaultRequirement];
    }


    // Use setValue with shouldDirty option to ensure isDirty is updated
    setValue('sections', updatedSections, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true
    });
    clearErrors('sections');
  };

  return (
    <>
      <Form methods={methods} onSubmit={onSubmit}>
        {CONFIG.form.debug && <ValuesPreview onCloseDebug={() => { }} />}
        {/* Save/Discard Bar */}

        <ContextualSaveBar
          message="Unsaved changes"
          saveAction={{
            onAction: onSubmit,
            loading: isSubmitting || mixmatchCreateLoading || mixmatchUpdateLoading,
            content: isSubmitting || mixmatchCreateLoading || mixmatchUpdateLoading ? "Saving..." : "Save",
            disabled: isSubmitting || mixmatchCreateLoading || mixmatchUpdateLoading,
          }}
          discardAction={{
            onAction: () => {
              reset();
              // Reset any additional state if needed
              // setGroupData({ name: '', items: [] });
              // setSelectionItems([]);
            },
          }}
        />
        <Grid>
          {/* First Card (spans 8 out of 12 columns) */}
          <Grid.Cell columnSpan={{ xs: 12, sm: 8, md: 8, lg: 8, xl: 8 }}>
            <BlockStack gap="400">
              <Card roundedAbove="sm">
                <BlockStack gap="200">
                  <Text as="h2" variant="headingSm">
                    Sections
                  </Text>
                  {fields.map((item, index) => {
                    const requirement = watch(`sections.${index}.requirement`); // ✅ use top level `watch`
                    const firstImageSrc = item?.items[0]?.images?.[0]?.originalSrc || defaultImage;

                    return (
                      <Card key={item.id} padding="400" roundedAbove="sm">
                        <BlockStack gap="300">
                          <InlineGrid columns={{ xs: 1, sm: 2 }} gap="400">
                            <InlineStack align="start" blockAlign="center" wrap gap="300">
                              <Thumbnail
                                size="small"
                                source={firstImageSrc}
                                alt="Section"
                              />
                              <InlineStack wrap gap="100">
                                <Text as="h3" variant="bodyMd" fontWeight="semibold">
                                  {item?.sectionName}
                                </Text>
                              </InlineStack>
                              {/* <Text variant="headingSm" fontWeight="semibold">
                                {`Section ${index + 1} : ${item?.sectionName}`}
                              </Text> */}
                            </InlineStack>
                            <InlineStack align="end" gap="200">
                              <Button onClick={() => {
                                isOpenEditResourcePicker.onTrue();
                                setIsSetEditResource({ ...item, _id: index + 1 });
                              }}>Edit</Button>
                              <Button tone="critical" onClick={() => remove(index)}>
                                Delete
                              </Button>
                            </InlineStack>
                          </InlineGrid>

                          {/* Form fields */}
                          <InlineGrid columns={{ xs: 1, sm: 2 }} gap="400">
                            {/* Requirement Select */}
                            <Field.Select
                              name={`sections.${index}.requirement`}
                              label="Requirement for discount"
                              options={requirementOptions}
                              onChange={(e) => {
                                const value = e;
                                setValue(`sections.${index}.requirement`, value);

                                // Cleanup other fields depending on requirement
                                if (value === 'exactQuantity') {
                                  setValue(`sections.${index}.minquantity`, undefined);
                                  setValue(`sections.${index}.maxquantity`, undefined);
                                } else if (value === 'minQuantity') {
                                  setValue(`sections.${index}.quantity`, undefined);
                                  setValue(`sections.${index}.maxquantity`, undefined);
                                } else if (value === 'rangeQuantity') {
                                  setValue(`sections.${index}.quantity`, undefined);
                                }
                              }}
                            />

                            {/* Conditionally Render Fields based on requirement */}
                            {requirement === 'exactQuantity' && (
                              <Field.NumberInput
                                name={`sections.${index}.quantity`}
                                label="Quantity"
                                min={1}
                                onChange={(newValue) => {
                                  const selectedValue = newValue;
                                  if (selectedValue) {
                                    setValue(`sections.${index}.quantity`, parseInt(selectedValue));
                                    clearErrors(`sections.${index}.quantity`);
                                  } else {
                                    setValue(`sections.${index}.quantity`, '');
                                    setError(`sections.${index}.quantity`, {
                                      type: 'manual',
                                      message: "Quantity must be a valid number.",
                                    }); // Set error when selection is cleared
                                  }
                                }}
                              />
                            )}

                            {requirement === 'minQuantity' && (
                              <Field.NumberInput
                                name={`sections.${index}.minquantity`}
                                label="Minimum Quantity"
                                min={1}
                                onChange={(newValue) => {
                                  const selectedValue = newValue;
                                  if (selectedValue) {
                                    setValue(`sections.${index}.minquantity`, parseInt(selectedValue));
                                    clearErrors(`sections.${index}.minquantity`);
                                  } else {
                                    setValue(`sections.${index}.minquantity`, '');
                                    setError(`sections.${index}.minquantity`, {
                                      type: 'manual',
                                      message: "Minimum Quantity must be a valid number.",
                                    }); // Set error when selection is cleared
                                  }
                                }}
                              />
                            )}

                            {requirement === 'rangeQuantity' && (
                              <>
                                <Field.NumberInput
                                  name={`sections.${index}.minquantity`}
                                  label="Minimum Quantity"
                                  min={1}
                                  onChange={(newValue) => {
                                    const selectedValue = newValue;
                                    if (selectedValue) {
                                      setValue(`sections.${index}.minquantity`, parseInt(selectedValue));
                                      clearErrors(`sections.${index}.minquantity`);
                                    } else {
                                      setValue(`sections.${index}.minquantity`, '');
                                      setError(`sections.${index}.minquantity`, {
                                        type: 'manual',
                                        message: "Minimum Quantity must be a valid number.",
                                      }); // Set error when selection is cleared
                                    }
                                  }}
                                />
                                <Field.NumberInput
                                  name={`sections.${index}.maxquantity`}
                                  label="Maximum Quantity"
                                  min={1}
                                  onChange={(newValue) => {
                                    const selectedValue = newValue;
                                    if (selectedValue) {
                                      setValue(`sections.${index}.maxquantity`, parseInt(selectedValue));
                                      clearErrors(`sections.${index}.maxquantity`);
                                    } else {
                                      setValue(`sections.${index}.maxquantity`, '');
                                      setError(`sections.${index}.maxquantity`, {
                                        type: 'manual',
                                        message: "Maximum Quantity must be a valid number.",
                                      }); // Set error when selection is cleared
                                    }
                                  }}
                                />
                              </>
                            )}

                            <Field.Text
                              name={`sections.${index}.description`}
                              label="Section Description"
                              multiline={3}
                            />
                          </InlineGrid>
                        </BlockStack>
                      </Card>
                    );
                  })}

                  {errors?.sections && (
                    <Text color="critical" variant="bodySm">
                      {errors.sections.message}
                    </Text>
                  )}


                  <InlineStack align="start">
                    {/* <Button
                  onClick={() => append({ firstName: 'Bill', lastName: 'Luo' })}
                  icon="add"
                >
                  Add Person
                </Button> */}
                    <Button
                      onClick={() => {
                        isOpenAddResourcePicker.onTrue();
                      }}
                      accessibilityLabel="Add MixMatchs"
                      icon={PlusIcon}
                    >
                      Add Section
                    </Button>
                  </InlineStack>
                </BlockStack>
              </Card>

              <Card sectioned>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingSm">
                    Discount
                  </Text>
                  <InlineGrid columns={{ xs: 2, sm: 3 }} >
                    <Layout.Section>
                      <Field.Select
                        name={`discount_type`}
                        label="Type"
                        options={DISCOUNT_TYPE_OPTIONS}
                      />
                    </Layout.Section>
                    <Layout.Section>
                      <Field.NumberInput
                        name="discount_value"
                        label="Value"
                        suffix={discountSuffix(values?.discount_type)}  // Dynamically apply suffix based on discount type
                        min={1}
                        onChange={(newValue) => {
                          const selectedValue = newValue;
                          if (selectedValue) {
                            setValue('discount_value', parseInt(selectedValue));
                            clearErrors('discount_value');
                          } else {
                            setValue('discount_value', '');
                            setError('discount_value', {
                              type: 'manual',
                              message: "Discount Value must be a valid number.",
                            }); // Set error when selection is cleared
                          }
                        }}
                      />
                    </Layout.Section>
                  </InlineGrid>
                </BlockStack>
              </Card>

              <Card sectioned>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingSm">
                    Average Qty
                  </Text>
                  <InlineGrid columns={{ xs: 2, sm: 3 }} >
                    <Layout.Section>
                       <Field.NumberInput name="totalqty" label="Totalqty" min={1}
                        onChange={(newValue) => {
                          
                          const selectedValue = newValue;
                          if (selectedValue) {
                            setValue('totalqty', parseInt(selectedValue));
                            clearErrors('totalqty');
                          } else {
                            setValue('totalqty', 0);
                            setError('totalqty', {
                              type: 'manual',
                              message: "Total Qty must be a valid number.",
                            }); // Set error when selection is cleared
                          }
                        }}/>
                    </Layout.Section>
                    
                  </InlineGrid>
                </BlockStack>
              </Card>

              <Card sectioned>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingSm">
                    Bundle details
                  </Text>
                  <Layout>
                    <Layout.Section>
                      <Field.Text name="title" label="Title" />
                    </Layout.Section>
                    <Layout.Section>
                      <Field.Text name="short_description" label="Short description" multiline={4} />
                    </Layout.Section>
                    {/* <Layout.Section>
                      <Field.Text name="description" label="Description" multiline={4} />
                    </Layout.Section> */}
                    <Layout.Section>
                      <Field.Dropzone name="media" label="Media" multiple={false} />
                    </Layout.Section>
                  </Layout>
                </BlockStack>
              </Card>
            </BlockStack>
          </Grid.Cell>

          {/* Second Card (spans 4 out of 12 columns) */}
          <Grid.Cell columnSpan={{ xs: 12, sm: 4, md: 4, lg: 4, xl: 4 }}>
            <LegacyCard title="Status" sectioned>
              <Field.Select
                name={`status`}
                options={STATUS_OPTIONS}
              />
            </LegacyCard>
            {/* <LegacyCard title="Preview" sectioned>

            </LegacyCard> */}
          </Grid.Cell>
        </Grid>


      </Form>
      {isOpenAddResourcePicker.value && (
        <MixMatchResourcePicker
          dialog={isOpenAddResourcePicker}
          title="ADD SECTION"
          sectionLength={(values.sections?.length ?? 0) + 1}
          onSelect={handleSectionUpdate}
          sections={values.sections[0]}
        />
      )}
      {isOpenEditResourcePicker.value && (
        <MixMatchResourcePicker
          dialog={isOpenEditResourcePicker}
          title="Edit SECTION"
          currentSection={isSetEditResource}
          sectionLength={(values.sections?.length ?? 0) + 1}
          onSelect={handleSectionUpdate}
        />
      )}
    </>
  );
}
