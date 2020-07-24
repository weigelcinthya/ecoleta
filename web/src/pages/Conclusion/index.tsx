import React from 'react'; 
import './styles.css';
import { FiCheckCircle } from 'react-icons/fi';


const Conclusion = () => {

    return (
        <div className="conclusionContainer">
            <FiCheckCircle size="4em" color="#2FB86E"/>
            <h1 className="title">Cadastro concluído!</h1>
        </div>
    )

}


export default Conclusion; 