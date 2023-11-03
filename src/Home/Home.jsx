import React, { useEffect, useState } from "react";
import HistoryAPI from "../API/HistoryAPI";
import UserAPI from "../API/UserAPI";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import dateFormat from "dateformat";

import io from "socket.io-client";
const socket = io("http://localhost:5000", { transports: ["websocket"] });

Home.propTypes = {};
function Home(props) {
  const userId = localStorage.getItem("id_user");

  const [history, setHistory] = useState([]);
  const [client, setClient] = useState(0);
  const [earnings, setEarnings] = useState([]);
  const [newOrder, setNewOrder] = useState([]);

  // select expiryDate to check token is still valid
  const expiryDate = localStorage.getItem("expiryDate");
  const timeRemaining = new Date(expiryDate).getTime() - new Date().getTime();

  const autoLogout = (miliseconds) => {
    if (miliseconds < 0) {
      localStorage.clear();
      window.location.replace("/login");
      return;
    }

    if (miliseconds > 0) {
      setTimeout(() => {
        localStorage.clear();
        window.location.replace("/login");
        return;
      }, miliseconds);
    }
  };

  autoLogout(timeRemaining);

  useEffect(async () => {
    if (userId) {
      const response = await HistoryAPI.getAll(userId);
      if (response.length < 1) {
        return;
      }
      setHistory(response);
      const earning = response
        .map((order) => {
          return order.total;
        })
        .reduce((sum, order) => {
          return parseInt(sum) + parseInt(order);
        });
      setEarnings(earning);

      const date = new Date();
      const newOrderToday = response.filter((order) => {
        return (
          dateFormat(order.date, "dddd, mmmm dS, yyyy") ===
          dateFormat(date, "dddd, mmmm dS, yyyy")
        );
      });
      setNewOrder(newOrderToday);
    }
  }, [userId]);

  useEffect(async () => {
    const response = await UserAPI.getAllData();
    const client = response.filter((user) => {
      return user.role.isClient;
    });
    setClient(client);
  }, []);

  //hàm này dùng để xác nhận đơn đặt hàng:
  const confirmOrderHandler = (data) => {
    console.log(data);
    socket.emit("confirm_order", data);
    window.location.reload();
  };
  const cancleOrderHandler = (data) => {
    console.log(data);
    socket.emit("cancle_order", data);
    window.location.reload();
  };

  return (
    <div className="page-wrapper">
      <div className="page-breadcrumb">
        <div className="row">
          <div className="col-7 align-self-center">
            {/* <h3 className='page-title text-truncate text-dark font-weight-medium mb-1'>
							Good Morning Jason!
						</h3> */}
            <div className="d-flex align-items-center">
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb m-0 p-0">
                  <li className="breadcrumb-item">
                    <Link to="/">Thống Kê Chính</Link>
                  </li>
                </ol>
              </nav>
            </div>
          </div>
        </div>
      </div>
      <div className="container-fluid">
        <div className="card-group">
          <div className="card border-right">
            <div className="card-body">
              <div className="d-flex d-lg-flex d-md-block align-items-center">
                <div>
                  <div className="d-inline-flex align-items-center">
                    <h2 className="text-dark mb-1 font-weight-medium">
                      {client.length}
                    </h2>
                  </div>
                  <h6 className="text-muted font-weight-normal mb-0 w-100 text-truncate">
                    Khách Hàng
                  </h6>
                </div>
                <div className="ml-auto mt-md-3 mt-lg-0">
                  <span className="opacity-7 text-muted">
                    <i data-feather="user-plus"></i>
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="card border-right">
            <div className="card-body">
              <div className="d-flex d-lg-flex d-md-block align-items-center">
                <div>
                  <h2 className="text-dark mb-1 w-100 text-truncate font-weight-medium">
                    <sup className="set-doller">$</sup>
                    {earnings}
                  </h2>
                  <h6 className="text-muted font-weight-normal mb-0 w-100 text-truncate">
                    Thu Nhập
                  </h6>
                </div>
                <div className="ml-auto mt-md-3 mt-lg-0">
                  <span className="opacity-7 text-muted">
                    <i data-feather="dollar-sign"></i>
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="card border-right">
            <div className="card-body">
              <div className="d-flex d-lg-flex d-md-block align-items-center">
                <div>
                  <div className="d-inline-flex align-items-center">
                    <h2 className="text-dark mb-1 font-weight-medium">
                      {newOrder.length}
                    </h2>
                  </div>
                  <h6 className="text-muted font-weight-normal mb-0 w-100 text-truncate">
                    Đơn Hàng Mới
                  </h6>
                </div>
                <div className="ml-auto mt-md-3 mt-lg-0">
                  <span className="opacity-7 text-muted">
                    <i data-feather="file-plus"></i>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-body">
                <h4 className="card-title">Thống Kê Đơn Hàng</h4>

                <br />
                <div className="table-responsive">
                  <table className="table table-striped table-bordered no-wrap">
                    <thead>
                      <tr>
                        <th>ID Người Dùng</th>
                        <th>Tên</th>
                        <th>Số Điện Thoại</th>
                        <th>Địa Chỉ</th>
                        <th>Tổng Thanh Toán</th>
                        <th>Phương Thức Thanh Toán</th>
                        <th>Ngày Đặt Hàng</th>
                        <th>Trạng Thái</th>
                        <th>Hành Động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history &&
                        history.map((value) => (
                          <tr key={value._id}>
                            <td>{value.userId}</td>
                            <td>{value.fullname}</td>
                            <td>{value.phone}</td>
                            <td>{value.address}</td>
                            <td>{value.total}</td>
                            <td>{value.payment}</td>
                            <td>{value.date.slice(0, 10)}</td>
                            <td>
                              {value.status === 1
                                ? " Xác Nhận"
                                : `Chờ Xác Nhận`}
                              {value.status === 1 && (
                                <svg
                                  width="30px"
                                  height="30px"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                                  <g
                                    id="SVGRepo_tracerCarrier"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  ></g>
                                  <g id="SVGRepo_iconCarrier">
                                    {" "}
                                    <path
                                      opacity="0.4"
                                      d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                                      fill="#12dd0e"
                                    ></path>{" "}
                                    <path
                                      d="M10.5795 15.5801C10.3795 15.5801 10.1895 15.5001 10.0495 15.3601L7.21945 12.5301C6.92945 12.2401 6.92945 11.7601 7.21945 11.4701C7.50945 11.1801 7.98945 11.1801 8.27945 11.4701L10.5795 13.7701L15.7195 8.6301C16.0095 8.3401 16.4895 8.3401 16.7795 8.6301C17.0695 8.9201 17.0695 9.4001 16.7795 9.6901L11.1095 15.3601C10.9695 15.5001 10.7795 15.5801 10.5795 15.5801Z"
                                      fill="#12dd0e"
                                    ></path>{" "}
                                  </g>
                                </svg>
                              )}
                            </td>
                            <td>
                              {value.status === 0 && (
                                <a
                                  style={{
                                    cursor: "pointer",
                                    color: "white",
                                  }}
                                  className="btn btn-success"
                                  onClick={() => {
                                    confirmOrderHandler(value._id);
                                  }}
                                >
                                  Xác Nhận
                                </a>
                              )}
                              {value.status === 1 && (
                                <a
                                  onClick={() => {
                                    cancleOrderHandler(value._id);
                                  }}
                                  style={{
                                    cursor: "pointer",
                                    color: "white",
                                  }}
                                  className="btn btn-error"
                                >
                                  Hủy
                                </a>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <footer className="footer text-center text-muted"></footer>
    </div>
  );
}

export default Home;
