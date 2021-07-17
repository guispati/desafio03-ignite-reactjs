import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
        const newCart = [...cart];
        const checkProduct = newCart.find(product => product.id === productId);
        const cartApi = await api.get(`/stock/${productId}`);
        var productAmount = 0;

        if (checkProduct) {
            productAmount = checkProduct.amount + 1;
            if (productAmount > cartApi.data.amount) {
                toast.error('Quantidade solicitada fora de estoque');
                return;
            }
            checkProduct.amount += 1;
        } else {
            const productApi = await api.get(`/products/${productId}`);
            const newProduct = {
                ...productApi.data,
                amount: 1
            }
            newCart.push(newProduct);
        }
        
        

        setCart(newCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    } catch {
        toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
        const newCart = [...cart];
        const checkProduct = newCart.find(product => product.id === productId);
        if (checkProduct) {
            newCart.splice(newCart.indexOf(checkProduct), 1);
            setCart(newCart);
            localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
        } else {
            throw Error();
        }
    } catch {
        toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
        if (amount <= 0)
            return;

        const cartApi = await api.get(`/stock/${productId}`);

        if (amount > cartApi.data.amount) {
            toast.error('Quantidade solicitada fora de estoque');
            return;
        }

        const newCart = [...cart];
        const checkProduct = newCart.find(product => product.id === productId);
        if (checkProduct) {
            checkProduct.amount = amount;
            setCart(newCart);
            localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
        } else {
            throw Error();
        }
    } catch {
        toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
