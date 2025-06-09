const ROOTS = {
  DASHBOARD: '/app',
};

export const paths = {
  // comingSoon: '/coming-soon',
  // maintenance: '/maintenance',
  // pricing: '/pricing',
  // payment: '/payment',
  // about: '/about-us',
  // contact: '/contact-us',
  // faqs: '/faqs',
  // page403: '/error/403',
  // page404: '/error/404',
  // page500: '/error/500',
  docs: 'https://docs.minimals.cc',
  // DASHBOARD
  dashboard: {
    root: ROOTS.DASHBOARD,
    home: `${ROOTS.DASHBOARD}/`,
    products: {
      list: `${ROOTS.DASHBOARD}/products/list`,
      new: `${ROOTS.DASHBOARD}/products/create`,
      edit: (id) => `${ROOTS.DASHBOARD}/products/edit/${id}`,
      view: (id) => `${ROOTS.DASHBOARD}/products/view/${id}`,
      detail: (id) => `${ROOTS.DASHBOARD}/products/detail/${id}`,
    },
    mixmatch: {
      list: `${ROOTS.DASHBOARD}/mixmatch/list`,
      new: `${ROOTS.DASHBOARD}/mixmatch/create`,
      edit: (id) => `${ROOTS.DASHBOARD}/mixmatch/edit/${id}`,
      view: (id) => `${ROOTS.DASHBOARD}/mixmatch/view/${id}`,
    },
  },
};
