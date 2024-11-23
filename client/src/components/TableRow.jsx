import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Loader from './Loader';
import Form from 'react-bootstrap/Form';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import '../../public/css/picker.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function TableRow({ board_id, item_ids, item_names, length }) {
    const token = localStorage.getItem('access_token');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dates, setDates] = useState({});
    const [files, setFiles] = useState({});

    useEffect(() => {
        // Only send the request if item_ids is not empty
        if (item_ids && item_ids.length > 0) {
            axios.post('https://api.monday.com/v2', {
                query: `query {
                    items (ids: [${item_ids.join(',')}]) {
                        column_values {
                            column {
                                id
                                title
                            }
                            id
                            type
                            value
                            ... on StatusValue {
                                label
                                update_id
                                label_style {border color}
                            }
                            ... on DateValue {
                                time
                                date
                            }
                            ... on PeopleValue {
                                text
                            }
                             ... on TextValue {
                                text
                                value
                            }
                            ... on NumbersValue {
                                number
                                id
                                symbol
                                direction
                            }
                        }
                    }
                }`,
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }).then((response) => {
                setLoading(false);
                console.log("items : ", response?.data?.data?.items);
                setItems(response?.data?.data?.items || []);
                const initialDates = {};
                const initialFiles = {};
                response?.data?.data?.items.forEach(item => {
                    const itemId = JSON.parse(item.column_values.find(col => col.type === 'item_id').value).item_id
                    const dateColumn = item.column_values.find(col => col.type === 'date');
                    const fileColumn = item.column_values.find(col => col.type === 'file');
                    
                    if (dateColumn?.date) {
                        initialDates[itemId] = new Date(dateColumn.date);
                    }
                    if(fileColumn?.value) {
                        initialFiles[itemId] = JSON.parse(fileColumn?.value).files?.[0]?.name;
                    }
                });
                setDates(initialDates);
                setFiles(initialFiles);
                // console.log(dates);
            }).catch((error) => {
                console.error('Error fetching data from Monday.com:', error);
                setLoading(false);
            });
        }
    }, [item_ids, token]);

    const updateColumnValue = async (boardId, itemId, columnId, value) => {
        // console.log('board id: ', boardId);
        // console.log('item id: ', itemId);
        // console.log('column id: ', columnId);
        // console.log('value: ', value);
        await axios.post('https://api.monday.com/v2', {
            query: `mutation {
                        change_simple_column_value (item_id:${itemId}, board_id:${boardId}, column_id:"${columnId}", value: "${value}") {
                            id
                        }
                    }`,
        }, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }).then((response) => {
            toast.success("Column updated successfully!");
            console.log("response after updating value : ", response);
        }).catch((error) => {
            toast.error("An unknown error occured! Try again.");
            console.log("error in updating value : ", error);
        })
    };

    const handleChange = (boardId, itemId, columnId, value) => {
        updateColumnValue(boardId, itemId, columnId, value);
    };

    const statuses = {
        task_status: {
            'Ready To Start': 'Ready To Start',
            'Progress': 'Progress',
            'Waiting For Review': 'Waiting For Review',
            'Pending Deploy': 'Pending Deploy',
            'Done': 'Done'
        },
        task_priority: {
            'Critical': 'Critical',
            'Best Effort': 'Best Effort',
            'High': 'High',
            'Missing': 'Missing',
            'Medium': 'Medium',
            'Low': 'Low'
        },
        task_type: {
            'Quality': 'Quality',
            'Feature': 'Feature',
            'Bug': 'Bug',
            'Security': 'Security',
            'Test': 'Test'
        }
    }

    const handleDateChange = (boardId, itemId, date) => {
        const formattedDate = date.toISOString().split('T')[0];
        // console.log(formattedDate)
        setDates(prevDates => ({
            ...prevDates,
            [itemId]: formattedDate
        }));

        updateColumnValue(boardId, itemId, 'date', formattedDate);
    }

    return (
        <>
            <div>
                <ToastContainer />
            </div>
            {(loading && length) && (
                <tbody>
                    <tr>
                        <td className="text-center border border-pink-100 py-8" colSpan={length}>
                            <Loader width={15} height={15} />
                        </td>
                    </tr>
                </tbody>
            )}

            {!loading && (
                <tbody>
                    {items?.map((item, itemIndex) => (
                        <tr key={itemIndex}>
                            {item?.column_values?.map((column, columnIndex) => (
                                <>
                                    {columnIndex == 0 && (
                                        <td key={0} className="border border-pink-800 px-1 text-center w-fit text-xs whitespace-nowrap py-2">
                                            {item_names[itemIndex]}
                                        </td>
                                    )}
                                    <td key={columnIndex + 1} style={{ backgroundColor: `${column?.type == "status" ? column?.label_style?.color : ''}`, width: `${column?.type == "status" ? '12%' : ''}`,padding: `${column?.type == "status" ? '0 15px' : ''}` }} className="border px-1 border-pink-800 text-center w-fit text-xs whitespace-nowrap py-2">
                                        {/* {column?.type === "status" && (
                                            <>
                                                {column?.label}
                                            </>
                                        )} */}
                                        {/* {(column?.type == "date" && column?.date) && (
                                            <>{column?.date} {column?.time}</>
                                        )} */}
                                        {(column?.type == "date") && (
                                            <DatePicker 
                                                dateFormat={"yyyy-MM-dd"}
                                                selected={dates[JSON.parse(item.column_values.find(col => col.type === 'item_id').value).item_id]} 
                                                onChange={(date) => handleDateChange(board_id, JSON.parse(item.column_values.find(col => col.type === 'item_id').value).item_id, date)} 
                                            />
                                        )}
                                        {(column?.type == "people") && (
                                            <>
                                                {column?.text !== "" && (
                                                    <>{column?.text}</>
                                                )}
                                                {column?.text == "" && (
                                                    <>---</>
                                                )}
                                            </>
                                        )}
                                        {(column?.type == "text") && (
                                            <>
                                                {column?.text !== "" && (
                                                    <>{column?.text}</>
                                                )}
                                                {column?.text == "" && (
                                                    <>---</>
                                                )}
                                            </>
                                        )}
                                        {/* {(column?.type == "numbers") && (
                                            <>
                                                {column?.number !== "" && (
                                                    <>{column?.number}</>
                                                )}
                                                {(column?.number == null || column?.number == "") && (
                                                    <>---</>
                                                )}
                                            </>
                                        )} */}
                                        {column?.type === "item_id" && (
                                            <>
                                                {column?.value ? JSON.parse(column?.value)?.item_id : "---"}
                                            </>
                                        )}
                                        {column?.type === "file" && (
                                            <>
                                                {column?.value ? JSON.parse(column?.value)?.files?.[0]?.name : "---"}
                                            </>
                                            // console.log(JSON.parse(column?.value)?.files?.[0]?.name)
                                            // <Form.Control type='file' size="sm" value={JSON.parse(column?.value)?.files?.[0]?.name ?? null}/>
                                        )}
                                        {column.type === 'status' && (
                                            <Form.Select
                                                style={{ backgroundColor: `${column?.type == "status" ? column?.label_style?.color : ''}` }}
                                                onChange={(e) => handleChange(board_id, JSON.parse(item.column_values.find((col) => col.id === "item_id").value).item_id, column.id, e.target.value)}
                                            >
                                                {statuses[column.id] &&
                                                    Object.entries(statuses[column.id]).map(([key, label]) => (
                                                        <option key={key} value={label} selected={column?.label === label} >
                                                            {label}
                                                        </option>
                                                    ))
                                                }
                                            </Form.Select>
                                        )}
                                    </td>
                                </>
                            ))}
                        </tr>
                    ))}
                </tbody>
            )}
        </>
    );
}

export default TableRow;
