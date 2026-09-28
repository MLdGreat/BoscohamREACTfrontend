import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import NotFound from './components/publicWebsite/NotFound.jsx'
import ForSaleCategory from './components/publicWebsite/ForSaleCategory.jsx'
import ForShortletCategory from './components/publicWebsite/ForShortletCategory.jsx'
import ForApartmentCategory from './components/publicWebsite/ForApartmentCategory.jsx'
import AuthPage from './components/publicWebsite/AuthPage.jsx'

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
   
  },
  {
     path:"/properties",
    element: <ForSaleCategory />,
  },
  {
    path: "/shortlets",
    element: <ForShortletCategory />,
  },
  {
    path: "/apartments",
    element: <ForApartmentCategory />,
  },
  {
    path: "/signup",
    element: <AuthPage mode="signup" />,
  },
  {
    path: "/login",
    element: <AuthPage mode="login" />,
  },
  {
    path:"*",
    element: <NotFound />,
  }
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)
