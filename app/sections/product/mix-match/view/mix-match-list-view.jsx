import { useLoaderData, useNavigate, useFetcher } from "@remix-run/react";
import { Card, Page, IndexTable, useIndexResourceState, Badge, EmptyState, Text, Pagination, Button, Modal } from "@shopify/polaris";
import { useCallback, useState, useEffect } from "react";
import { paths } from "../../../../routes/paths";
import { useDispatch, useSelector } from "react-redux";
import useToast from "../../../../components/toast/use-toast";
import { MixMatchDeleteApi } from "../../../../redux/slices/mixmatchSlice";

export default function MixMatchListView() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const fetcher = useFetcher();
  const { showToast } = useToast();

  // Get data from Remix loader
  const loaderData = useLoaderData();

  // Extract data from loader response
  const mediaUrl = loaderData?.media_url || [];
  const mixMatchBundleData = loaderData?.data || [];
  // const totalRows = loaderData?.total ?? 0;
  const currentPage = loaderData?.current_page ?? 1;
  const perPage = loaderData?.per_page ?? 10;
  const lastPage = loaderData?.last_page ?? 1;

  // Get filter and sort state from Redux
  const filterModel = useSelector((state) => state.mixmatch.filterModel);
  const sort = useSelector((state) => state.mixmatch.sort);
  const mixmatchLoading = useSelector((state) => state.mixmatch.loading);

  // State for delete confirmation modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [bundleToDelete, setBundleToDelete] = useState(null);

  // Handle page change
  const handlePageChange = useCallback((page) => {
    // Navigate to the same route with updated query params
    navigate(`?page=${page}&limit=${perPage}&sort=${sort}&filterModel=${JSON.stringify(filterModel)}`);
  }, [navigate, perPage, sort, filterModel]);

  // Handle edit action
  const handleEdit = useCallback((bundleId) => {
    navigate(paths.dashboard.mixmatch.edit(bundleId));
  }, [navigate]);

  // Handle delete action
  const handleDelete = useCallback((bundle) => {
    setBundleToDelete(bundle);
    setDeleteModalOpen(true);
  }, []);

  // Handle delete confirmation
  const handleDeleteConfirm = useCallback(() => {
    if (bundleToDelete) {
      // Dispatch the Redux action directly
      const selectedRowIds = bundleToDelete?.id?.split(',');
      dispatch(MixMatchDeleteApi({ selectedRowIds })).then(action => {
        if (action.meta.requestStatus === 'fulfilled') {
          const payloadData = action.payload;
          const message = payloadData?.data?.message || 'Deleted successfully';
          showToast({
            message,
            status: 'success'
          });
          // Close the modal
          setDeleteModalOpen(false);
          setBundleToDelete(null);
          navigate(paths.dashboard.mixmatch.list);
        } else if (action.meta.requestStatus === 'rejected') {
          const status = action.payload?.status;
          const message = action.payload?.message;
          const data = action.payload;
          let errorMessage = data?.data?.message ? data?.data?.message : (data?.message ? data?.message : 'An unexpected error occurred. Please try again.');
          showToast({
            message: errorMessage || "Deleted Failed",
            status: 'error'
          });
        }
      });
    }
  }, [bundleToDelete, dispatch, showToast, navigate]);

  // Refresh the list after successful deletion
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.success) {
      // Refresh the current page to show updated data
      navigate(`?page=${currentPage}&limit=${perPage}&sort=${sort}&filterModel=${JSON.stringify(filterModel)}`);
    }
  }, [fetcher.state, fetcher.data, navigate, currentPage, perPage, sort, filterModel]);

  // Resource name for the index table
  const resourceName = {
    singular: "MixMatch bundle",
    plural: "MixMatch bundles",
  };

  // Resource selection state
  const { selectedResources, allResourcesSelected, handleSelectionChange } = useIndexResourceState(mixMatchBundleData);

  // Handle delete cancellation - moved after handleSelectionChange is defined
  const handleDeleteCancel = useCallback(() => {
    setDeleteModalOpen(false);
    setBundleToDelete(null);
    // Clear selected resources when canceling delete
    handleSelectionChange({ selectedResources: [] });
  }, [handleSelectionChange]);

  const promotedBulkActions = [
    {
      content: 'Delete Selected All',
      onAction: () => {
        if (selectedResources.length === 0) {
          showToast({
            message: "Please select at least one bundle to delete",
            status: "warning"
          });
          return;
        }

        // Show confirmation modal for bulk delete
        setBundleToDelete({
          id: selectedResources.join(','),
          title: `${selectedResources.length} bundles`
        });
        setDeleteModalOpen(true);
      },
      disabled: selectedResources.length === 0,
      destructive: true,
    },
  ];

  const discountType = ['FIX', 'PER', 'SET'];

  // Utility function to format discount value based on type
  const formatDiscountValue = (value, type) => {
    if (!value || !type) return '';

    switch (type) {
      case 'PER':
        return `${value}%`;
      case 'FIX':
        return `Rs. ${value}/-`;
      case 'SET':
        return `Rs. ${value}/-`;
      default:
        return `Rs. ${value}/-`;
    }
  };

  // Utility function to get status badge
  const getStatusBadge = (status) => {
    if (!status) return null;

    switch (status.toLowerCase()) {
      case 'active':
        return <Badge tone="success">Active</Badge>;
      case 'draft':
        return <Badge tone="warning">Draft</Badge>;
      case 'inactive':
        return <Badge tone="critical">Inactive</Badge>;
      case 'pending':
        return <Badge tone="info">Pending</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Row markup for the index table
  const rowMarkup = mixMatchBundleData.map(
    (bundle, index) => {
      // console.log(bundle);
      return (
        <IndexTable.Row
          id={bundle.id}
          key={bundle.id}
          selected={selectedResources.includes(bundle.id)}
          position={index}
        >
          <IndexTable.Cell>
            {bundle.media ? (
              <img
                src={`${mediaUrl}/${bundle.media}`}
                alt={bundle.title}
                style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
              />
            ) : (
              <div style={{ width: '40px', height: '40px', backgroundColor: '#f4f6f8', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Text variant="bodyMd" as="span" color="subdued">No image</Text>
              </div>
            )}
          </IndexTable.Cell>
          <IndexTable.Cell>
            <Text variant="bodyMd" fontWeight="bold">{bundle.title}</Text>
            {bundle.short_description && (
              <Text variant="bodySm" color="subdued">{bundle.short_description}</Text>
            )}
          </IndexTable.Cell>
          <IndexTable.Cell>
            {formatDiscountValue(bundle.discount_value, bundle.discount_type)}
          </IndexTable.Cell>
          <IndexTable.Cell>
            {bundle.discount_type}
          </IndexTable.Cell>
          <IndexTable.Cell>
            {getStatusBadge(bundle.status)}
          </IndexTable.Cell>
          <IndexTable.Cell>
            {new Date(bundle.createdAt).toLocaleDateString()}
          </IndexTable.Cell>
          <IndexTable.Cell>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button type="button" size="slim" onClick={(e) => {
                e.stopPropagation(); // ✋ Prevent row selection
                handleEdit(bundle.id);
              }}>Edit</Button>
            </div>
          </IndexTable.Cell>
        </IndexTable.Row>
      )
    }
  );

  // Empty state component
  const emptyStateMarkup = (
    <EmptyState
      heading="No MixMatch bundles found"
      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
      action={{
        content: "Create MixMatch bundle",
        onAction: () => navigate(paths.dashboard.mixmatch.new),
      }}
    >
      <p>Create a new MixMatch bundle to get started.</p>
    </EmptyState>
  );

  return (
    <Page
      fullWidth={false}
      // backAction={{ content: "Back To Dashboard", onAction: () => navigate(paths.dashboard.root) }}
      title={"Mix & Match Bundles"}
      primaryAction={{ content: "Create Mix & Match", onAction: () => navigate(paths.dashboard.mixmatch.new) }}
    >
      <Card padding="0">
        {mixMatchBundleData.length === 0 ? (
          emptyStateMarkup
        ) : (
          <>
            <IndexTable
              resourceName={resourceName}
              itemCount={mixMatchBundleData.length}
              selectedItemsCount={
                allResourcesSelected ? "All" : selectedResources.length
              }
              onSelectionChange={handleSelectionChange}
              sortable={[false, true, true, true, true, true, true]}
              headings={[
                { title: "" },
                { title: "Title" },
                { title: "Discount" },
                { title: "Discount Type" },
                { title: "Status" },
                { title: "Created Date" },
                { title: "Actions" },
              ]}
              promotedBulkActions={promotedBulkActions}
            >
              {rowMarkup}
            </IndexTable>

            {/* Pagination */}
            {lastPage > 1 && (
              <div style={{ padding: '1rem', display: 'flex', justifyContent: 'center' }}>
                <Pagination
                  label={`Page ${currentPage} of ${lastPage}`}
                  hasPrevious={currentPage > 1}
                  onPrevious={() => handlePageChange(currentPage - 1)}
                  hasNext={currentPage < lastPage}
                  onNext={() => handlePageChange(currentPage + 1)}
                />
              </div>
            )}
          </>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteModalOpen}
        onClose={handleDeleteCancel}
        title="Delete MixMatch Bundle"
        primaryAction={{
          content: "Delete",
          destructive: true,
          onAction: handleDeleteConfirm,
          loading: mixmatchLoading?.delete,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: handleDeleteCancel,
            disabled: mixmatchLoading?.delete,
          },
        ]}
      >
        <Modal.Section>
          <p>Are you sure you want to delete the MixMatch bundle "{bundleToDelete?.title}"? This action cannot be undone.</p>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
