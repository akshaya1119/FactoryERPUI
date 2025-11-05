// import React from 'react';
// import { Breadcrumb as BootstrapBreadcrumb } from 'react-bootstrap';
// import useBreadcrumbStore from './../store/useBreadcrumbStore';

// const Breadcrumb = () => {
//   const { breadcrumbItems } = useBreadcrumbStore();

//   return (
//     <div className="p-2 m-2">
//       <nav aria-label="breadcrumb">
//         <BootstrapBreadcrumb>
//           {breadcrumbItems.map((item, index) => (
//             <BootstrapBreadcrumb.Item key={index} href={item.href} className="text-dark">
//               {item.label}
//             </BootstrapBreadcrumb.Item>
//           ))}
//         </BootstrapBreadcrumb>
//       </nav>
//     </div>
//   );
// };

// export default Breadcrumb;
import React, { useEffect } from 'react';
import { Breadcrumb as BootstrapBreadcrumb } from 'react-bootstrap';
import { useLocation } from 'react-router-dom';
import useBreadcrumbStore from './../store/useBreadcrumbStore';
import routes from './../scripts/routes.js'; // Import your routes object

const Breadcrumb = () => {
  const location = useLocation();
  const { breadcrumbItems, setCurrentPage, resetBreadcrumb } = useBreadcrumbStore();

  useEffect(() => {
    // Clear previous breadcrumbs
    resetBreadcrumb();

    // Get the current pathname from the location
    const currentPath = location.pathname;

    // Filter out the route paths that match the current path
    Object.keys(routes)
      .filter((route) => currentPath.startsWith(route))
      .forEach((route) => {
        setCurrentPage(routes[route], route); // Use the correct setter function from the store
      });
  }, [location, setCurrentPage, resetBreadcrumb]);

  return (
    <div className="p-2 m-2">
      <nav aria-label="breadcrumb">
        <BootstrapBreadcrumb>
          {breadcrumbItems.map((item, index) => (
            <BootstrapBreadcrumb.Item key={index} href={item.href} className="text-dark">
              {item.label}
            </BootstrapBreadcrumb.Item>
          ))}
        </BootstrapBreadcrumb>
      </nav>
    </div>
  );
};

export default Breadcrumb;
