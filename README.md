# ApexERP Project

## Overview
ApexERP is a comprehensive Enterprise Resource Planning system designed to streamline business operations and enhance productivity.

## Key Features
- Modular architecture for scalability
- Real-time data analytics
- Integrated workflow management
- Multi-user collaboration tools
- Customizable dashboards

## Technology Stack
- Frontend: React with Vite
- Backend: Node.js
- Database: PostgreSQL
- State Management: Zustand
- UI Framework: Ant Design

## Google Sheet Reference
For detailed project planning and documentation, please refer to our [Google Sheet](https://docs.google.com/spreadsheets/d/1YajPg5hwe0ow8eHWkJlVeO5g7RX93A3zy9A3Cl6khts/edit?gid=747833457#gid=747833457).

## API Usage Instructions

To use the API in this project, follow these steps:

1. Import the API instance:
   ```javascript
   import API from 'src\CustomHooks\MasterApiHooks\api.jsx';
   ```

2. Use the API instance to make requests:
   ```javascript
   const fetchData = async () => {
     try {
       const response = await API.get('/endpoint'); //if api us http://192.168.1.24:85/api/login then keep endpoint only /login
       // Handle the response
     } catch (error) {
       // Handle any errors
     }
   };
   ```

3. To prevent multiple API calls for the same data, create service files for each feature or module. For example:

   ```javascript
   // userService.js
   import API from './api';

   export const fetchUserData = async (userId) => {
     try {
       const response = await API.get(`/users/${userId}`);
       return response.data;
     } catch (error) {
       throw error;
     }
   };
   ```

   Then, in your components, use the service instead of calling the API directly:

   ```javascript
   import { fetchUserData } from './userService';

   const UserComponent = ({ userId }) => {
     const [userData, setUserData] = useState(null);

     useEffect(() => {
       const loadUserData = async () => {
         try {
           const data = await fetchUserData(userId);
           setUserData(data);
         } catch (error) {
           // Handle error
         }
       };
       loadUserData();
     }, [userId]);

     // Render component using userData
   };
   ```

# Vite Project Build and Deploy Instructions

To successfully build and deploy the ApexERP project using Vite, please follow these steps:

1. Configuration:
   - Open the `vite.config.js` file.
   - Locate the `outDir` setting and update it to point to the shared folder:
     `//192.168.1.27/e/ERP/ERPUI`

2. Access Permissions:
   - Ensure you have the necessary permissions to access and write to the shared folder.
   - If you encounter any issues, please contact your system administrator.

3. Build and Deploy:
   - Open your terminal or command prompt.
   - Navigate to the project directory.
   - Run the following command to build and deploy the project:
     ```
     npm run build -- --emptyOutDir
     ```
   - This command will create a production-ready build and place it in the specified shared folder.

4. Accessing the Application:
   - Once the build process is complete, you can access the application through your web browser.
   - Enter the following URL: `http://192.168.1.24:85`

If you encounter any issues during this process, please refer to the project documentation or contact the development team for assistance.

## Translation Function Usage

To use the translation function in your components, follow these steps:

1. Import the `useTranslation` hook at the top of your component file:
   ```javascript
   import { useTranslation } from 'react-i18next';
   ```

2. Inside your component, destructure the `t` function from the `useTranslation` hook:
   ```javascript
   const { t } = useTranslation();
   ```

3. Use the `t` function to render translated labels:
   ```javascript
   <h1>{t('welcomeMessage')}</h1>
   <p>{t('description')}</p>
   ```

4. To add new labels:
   - Navigate to the `/labels` route in the application.
   - Click on the "Add Message" button.
   - Enter the label key (e.g., 'welcomeMessage') and provide translations for supported languages.
   - Save the new label.

5. After adding a new label, you can immediately use it in your components with the `t` function.

Remember to use descriptive keys for your labels to maintain clarity in your code.
