const Cart = () => {
    console.log("here s")
}
const isProductInCart = (cart, id) => {
    for (let i = 0; i < cart.length; i++) {
        if(cart[i].id == id){
            return true;
        }
    }
    return false;
}

const calculateTotal = (cart) => {
    total = 0;
    for (let i = 0; i < cart.length; i++) {
        var price = cart[i].price
        total = total + (price * cart[i].quantity)
    }
    return total;
}

module.exports = {Cart, isProductInCart, calculateTotal};