import React, {useEffect, useState, ChangeEvent, FormEvent} from 'react'; 
import './styles.css';
import logo from '../../assets/logo.svg';
import {Link, useHistory} from 'react-router-dom';
import {FiArrowLeft} from 'react-icons/fi';
import {Map, TileLayer, Marker} from 'react-leaflet';
import { LeafletMouseEvent } from 'leaflet';
import api from '../../services/api';
import axios from 'axios';

//estado para array ou objeto é necessario informar o tipo

interface Item {
    id: number;
    name: string;
    image_url: string;
}

interface IBGEUFResponse {
    sigla: string;
}

interface IBGECityResponse {
    nome: string;
}


const CreatePoint = () => {

    const [items, setItems] = useState<Item[]>([]);
    const [ufs, setUfs] = useState<string[]>([]);
    const [cities, setCities] = useState<string[]>([]);
    const [formData, setFormData] = useState({
        name: '', 
        email: '', 
        whatsapp: ''
    })
    const [selectedItens, setSelectedItens] = useState<number[]>([]);
    const [initialPosition, setInitialPosition] = useState<[number, number]>([0, 0]);
    const [selectedUf, setSelectedUf] = useState('0');
    const [selectedCity, setSelectedCity] = useState('0');
    const [selectedPosition, setSelectedPosition] = useState<[number, number]>([0, 0]);
    
    const history = useHistory();

    useEffect(() => {
        api.get('items').then(response => {
           setItems(response.data);
        })
    }, []);

    useEffect(() => {
        axios.get<IBGEUFResponse[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados').then(response => {
            const ufInitials = response.data.map(uf => uf.sigla);
            setUfs(ufInitials);
        });
    }, []);

    useEffect(()=> {
        if(selectedUf === '0'){
            return;
        }

        axios.get<IBGECityResponse[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios`)
        .then(response => {
            const cityNames = response.data.map(city => city.nome);
            setCities(cityNames);
        });

    }, [selectedUf]);

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords; 
            setInitialPosition(
                [latitude, longitude]
            )
        })
    }, [])

    const handleSelectUf = (event: ChangeEvent<HTMLSelectElement>) => {
        const uf = event.target.value; 
        setSelectedUf(uf);
    }

    const handleSelectCity = (event: ChangeEvent<HTMLSelectElement>) => {
        const city = event.target.value; 
        setSelectedCity(city);
    }

    const handleMapClick = (event: LeafletMouseEvent) => {
        setSelectedPosition([
            event.latlng.lat, 
            event.latlng.lng])
    }

    const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        setFormData({...formData, [event.target.name]: event.target.value})
    }

    function handleSelectItem(id: number) {
        const alreadySelected = selectedItens.findIndex(item => item === id);

        if(alreadySelected >= 0) {
             const filteredItens = selectedItens.filter(item => item !== id);
             setSelectedItens(filteredItens);
        } else {
            setSelectedItens([...selectedItens, id]);
        }
    }

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        const {name, email, whatsapp} = formData; 
        const uf = selectedUf; 
        const city = selectedCity; 
        const [latitude, longitude] = selectedPosition; 
        const items = selectedItens; 

        const data = {
            name, 
            email, 
            whatsapp, 
            uf, 
            city, 
            latitude, 
            longitude, 
            items
        }; 

       await api.post('points', data);
       history.push('/done')
    }

    return (
        <div id="page-create-point">
            <header>
                <img src={logo} alt="Ecoleta" />

                <Link to="/">
                    <FiArrowLeft/>
                    Voltar para home
                </Link>
            </header>

            <form onSubmit={handleSubmit}>
                <h1>Cadastro do <br/>
                    ponto de coleta</h1>

                <fieldset>
                    <legend>
                       <h2>Dados</h2>
                    </legend>

                    <div className="field">
                        <label htmlFor="name">Nome da entidade</label>
                        <input type="text" name="name" id="name" onChange={handleInputChange}/>
                    </div>

                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="email">E-mail</label>
                            <input type="email" name="email" id="email" onChange={handleInputChange}/>
                        </div>
                        <div className="field">
                            <label htmlFor="whatsapp">Whatsapp</label>
                            <input type="text" name="whatsapp" id="whatsapp" onChange={handleInputChange}/>
                        </div>
                    </div>

                </fieldset>

                <fieldset>
                    <legend>
                       <h2>Endereço</h2>
                       <span>Selecione um endereço no mapa</span>
                    </legend>
                    
                    <Map center={initialPosition} zoom={14} onClick={handleMapClick}>
                      <TileLayer
                        attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                     <Marker position={selectedPosition}></Marker>
                    </Map>

                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="uf">Estado (UF)</label>
                            <select name="uf" id="uf" onChange={handleSelectUf} value={selectedUf}>
                                <option value="0">Selecione uma UF</option>
                                {ufs.map(uf => (
                                    <option key={uf} value={uf}>{uf}</option>
                                ))}
                            </select>
                        </div>
                        <div className="field">
                            <label htmlFor="city">Cidade</label>
                            <select name="city" id="city" onChange={handleSelectCity} value={selectedCity}> 
                                <option value="0">Selecione uma Cidade</option>
                                {cities.map(city => (
                                    <option key={city} value={city}>{city}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </fieldset>

                <fieldset>
                    <legend>
                       <h2>Ítens de coleta</h2>
                       <span>Selecione um ou mais itens abaixo</span>
                    </legend>

                    <ul className="items-grid">
                        {items.map(item => (
                            <li key={item.id} 
                                onClick={() => handleSelectItem(item.id)}
                                className={selectedItens.includes(item.id) ? 'selected' : ''}>
                             <img src={item.image_url} alt={item.name}/>
                             <span>{item.name}</span>
                            </li>
                        ))} 
                    </ul>
                </fieldset>

                <button type="submit">Cadastrar ponto de coleta</button>
            </form>
        </div>
    )
}

export default CreatePoint;