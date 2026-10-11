import './configurar';
import React from 'react';
import { setupIonicReact } from '@ionic/react';
import Login from '@bysellens/frontend-core/auth/Login';
import Inventario from './pages/Inventario';
import PortalApp from '@bysellens/frontend-core/runtime/PortalApp';
import { montar } from '@bysellens/frontend-core/runtime/montar';
setupIonicReact();
montar(<PortalApp pantalla={Inventario} inicioSesion={Login} />);
